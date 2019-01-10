const path = require('path');
const os = require('os');

const {
  readFileAsync,
  writeFileAsync,
  httpRequest,
  toUrlEncoded,
  resolvePath,
  base64Encode,
  base64Decode,
  listFilesRecursivly,
  toDirectory
} = require('./utils');

async function readCredentialsFile(subprojectDir) {
  /*
    reading credentials.json from...
      ...config.json path (subproject)
      ...current path (project)
      ...user dir (user)
      ...system (global)      NOT IMPLEMENTED
  */

  //TODO find file location for global config
  //const globalConfig = await readFileAsync(resolvePath('credentials.json'));

  const userConfig = path.resolve(os.homedir(), '.node-red-cli-tool');
  const projectConfig = resolvePath('node-red.credentials.json');
  const subProjectConfig = resolvePath(subprojectDir, 'node-red.credentials.json');

  let configFiles = [{
    file: userConfig,
    extractor: (file) => {
      return file.credentials;
    }
  }, projectConfig, subProjectConfig];

  configFiles = configFiles.map(async configFile => {
    try {
      if (typeof configFile === 'string') {
        configFile = {
          file: configFile
        };
      }

      let file = await readFileAsync(configFile.file);
      file = JSON.parse(file);

      const extractor = configFile.extractor;
      if (typeof extractor === 'function') {
        file = extractor(file);
      }

      return file;
    } catch (err) {
      return undefined;
    }
  });
  configFiles = await Promise.all(configFiles);
  configFiles = configFiles.filter(file => file ? true : false);

  const credentialsConfig = {};
  configFiles.forEach((configFile) => {
    Object.keys(configFile).forEach(stageConfig => {
      credentialsConfig[stageConfig] = configFile[stageConfig];
    });
  });
  return credentialsConfig;
}


async function detectSubProjects(depth) {
  let files = await listFilesRecursivly(resolvePath(), (filename, isDir) => {
    if ((filename.startsWith('.git') || filename.startsWith('tmp')) && isDir) {
      return false;
    }
    return isDir || filename.endsWith('node-red.config.json');
  }, depth);

  files = files.map(async (file) => {
    const filename = file;
    file = resolvePath(file);
    try {
      file = await readFileAsync(file);
      file = JSON.parse(file);

      file.directory = toDirectory(filename);

      return file;
    } catch (err) {
      return undefined;
    }
  });
  files = await Promise.all(files);
  files = files.filter(file => file ? typeof file.id == 'string' : false);

  const subProjects = {};
  files.forEach((file) => {
    const subProjectId = file.id;
    subProjects[subProjectId] = file;
    delete file.id;
  });
  return subProjects;
}

async function loadConfigFile(_projectId, args, stageRequired) {
  const subProjects = await detectSubProjects(args.maxDetectionDepth);
  const projectId = args.project;
  const flowConfigFile = subProjects[projectId];
  flowConfigFile.flowFile = resolvePath(flowConfigFile.directory, flowConfigFile.flowFile);
  flowConfigFile.projectId = projectId;

  if (stageRequired && args.stage === undefined) {
    throw `Stage arg is for this script required but its value is '${args.stage}'.`;
  }

  if (stageRequired) {
    const credentialsFile = await readCredentialsFile(flowConfigFile.directory);

    const stageKey = args.stage;
    const serverId = flowConfigFile.stages[stageKey];
    const secretServerConfig = credentialsFile[serverId];
    const secretProjectConfig =
      secretServerConfig.projects && secretServerConfig.projects[projectId] !== undefined ?
      secretServerConfig.projects[projectId] : {};

    delete secretServerConfig.projects;

    const writeProtected = {
      stageId: stageKey,
      serverId: serverId
    };
    Object.assign(
      flowConfigFile,
      secretServerConfig,
      secretProjectConfig,
      writeProtected);
  }

  if (flowConfigFile.password !== undefined) {
    const supportedTypes = ['plain', 'base64'];
    if (!flowConfigFile.passwordType) {
      flowConfigFile.passwordType = 'plain';
    } else if (!supportedTypes.includes(flowConfigFile.passwordType)) {
      throw `Password type '${flowConfigFile.passwordType}' ` +
        `is not one of the supported types: ${supportedTypes}.`;
    }

    if (flowConfigFile.passwordType === 'plain') {
      flowConfigFile.password = base64Encode(flowConfigFile.password);
      flowConfigFile.passwordType = 'base64';
    }
  }

  return flowConfigFile;
}

async function getToken(stageConfig) {
  if (stageConfig.username !== undefined && stageConfig.password !== undefined) {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded"
    };
    let data = {
      'client_id': 'node-red-editor',
      'grant_type': 'password',
      'scope': '',
      'username': stageConfig.username,
      'password': base64Decode(stageConfig.password)
    };
    data = toUrlEncoded(data);

    const res = await httpRequest('POST', stageConfig.url + '/auth/token', headers, data);
    const body = await res.json();
    const token = body.access_token;

    stageConfig.token = token;
    return {
      token
    };
  }
  return {
    token: undefined
  };
}

async function revokeToken(stageConfig) {
  const token = stageConfig.token;

  if (token) {
    const headers = {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    };
    const data = {
      token: token
    };
    const res = await httpRequest('POST', stageConfig.url + '/auth/revoke', Object.assign({}, headers), data);
    if (res.status !== 200) {
      throw `Revoke token didn't worked.`
    }
  }
  return {
    token: undefined
  };
}

function getNode(flowFileContent, predicate) {
  const matchingNodes = flowFileContent.nodes.filter(predicate);
  if (matchingNodes.length === 0) {
    throw `Unknown node`;
  } else if (matchingNodes.length > 1) {
    throw `Multiple nodes found`;
  } else {
    return matchingNodes[0];
  }
}

function getFunctionNode(flowFileContent, functionId) {
  const predicate = (node) => node.name && node.name.startsWith(functionId + ':');
  const node = getNode(flowFileContent, predicate);
  if (node.type === 'function') {
    return node;
  } else {
    throw `Node is not of type 'function'`;
  }
}

function getFlowSearchRegex(stageConfig) {
  const regexAsString = `sub-?project-?id:\\s*("|')${stageConfig.flowTextId}("|')`
  return new RegExp(regexAsString, "gi");
}

async function getFlowId(stageConfig) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + stageConfig.token,
    'Node-RED-API-Version': 'v2'
  };
  const flowsRes = await httpRequest('GET', stageConfig.url + '/flows', headers);
  let flows = (await flowsRes.json()).flows;

  const regex = getFlowSearchRegex(stageConfig);
  flows = flows.filter((node) => {
    return node.type && node.type === 'tab' && node.info && regex.test(node.info);
  });

  if (flows.length === 0) {
    throw `No flow with infoId '${stageConfig.flowTextId}' found.`;
  } else if (flows.length > 1) {
    throw `Multiple flows with infoId '${stageConfig.flowTextId}' found.`;
  }

  const flowId = flows[0].id;
  stageConfig.flowId = flowId;
  return flowId;
}

async function getFlow(stageConfig) {
  const flowId = await getFlowId(stageConfig);
  const headers = {
    'Authorization': 'Bearer ' + stageConfig.token
  };
  const res = await httpRequest('GET', stageConfig.url + '/flow/' + flowId, headers, null);
  if (res.status === 404) {
    throw `Flow with id ${flowId} not found.`;
  }
  return await res.json();
}

module.exports.loadConfigFile = loadConfigFile;
module.exports.getToken = getToken;
module.exports.revokeToken = revokeToken;

module.exports.getNode = getNode;
module.exports.getFunctionNode = getFunctionNode;
module.exports.getFlowSearchRegex = getFlowSearchRegex;
module.exports.getFlowId = getFlowId;
module.exports.getFlow = getFlow;
