const path = require('path');

const {
  readFileAsync,
  writeFileAsync,
  httpRequest,
  toUrlEncoded,
  resolvePath
} = require('./utils');


async function loadConfigFile(projectId) {
  const projectFilePromise = readFileAsync(resolvePath('project.json'));
  const credentialsFilePromise = readFileAsync(resolvePath('credentials.json'));

  const projectFile = JSON.parse(await projectFilePromise);
  const projectFlowConfig = projectFile[projectId];
  const flowConfigFilePromise = readFileAsync(resolvePath(projectFlowConfig.directory, 'config.json'));
  const flowConfigFile = JSON.parse(await flowConfigFilePromise);

  flowConfigFile.directory = projectFlowConfig.directory;
  flowConfigFile.flowFile = resolvePath(projectFlowConfig.directory, flowConfigFile.flowFile);
  flowConfigFile.projectId = projectId;

  const credentialsFile = JSON.parse(await credentialsFilePromise);
  Object.keys(flowConfigFile.stages).forEach((stageKey) => {
    const serverId = flowConfigFile.stages[stageKey];
    const secretServerConfig = credentialsFile[serverId];
    const secretProjectConfig = secretServerConfig.projects ? secretServerConfig.projects[projectId] : {};

    const serverConfig = Object.assign({}, secretServerConfig, secretProjectConfig, {
      id: stageKey,
      serverId: serverId
    });
    flowConfigFile.stages[stageKey] = serverConfig;
  });

  return flowConfigFile;
}

async function getToken(stageConfig) {
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded"
  };
  let data = {
    'client_id': 'node-red-editor',
    'grant_type': 'password',
    'scope': '',
    'username': stageConfig.username,
    'password': stageConfig.password
  };
  data = toUrlEncoded(data);

  const res = await httpRequest('POST', stageConfig.url + '/auth/token', headers, data);
  const body = await res.json();
  const token = body.access_token;

  stageConfig.token = token;
  return stageConfig;
}

async function revokeToken(stageConfig) {
  const token = stageConfig.token;

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

async function getFlow(stageConfig) {
  const headers = {
    'Authorization': 'Bearer ' + stageConfig.token
  };
  const res = await httpRequest('GET', stageConfig.url + '/flow/' + stageConfig.flowId, headers, null);
  if (res.status === 404) {
    throw `Flow with id ${stageConfig.flowId} not found.`;
  }
  return await res.json();
}

async function updateCredentialsFile(modificationCallback) {
  const credentialsFilePath = resolvePath('credentials.json');
  let credentialsFile = JSON.parse(await readFileAsync(credentialsFilePath));
  modificationCallback(credentialsFile);
  credentialsFile = JSON.stringify(credentialsFile, null, 4);
  await writeFileAsync(credentialsFilePath, credentialsFile, 'utf8');
}

module.exports.loadConfigFile = loadConfigFile;
module.exports.updateCredentialsFile = updateCredentialsFile;
module.exports.getToken = getToken;
module.exports.revokeToken = revokeToken;

module.exports.getNode = getNode;
module.exports.getFunctionNode = getFunctionNode;
module.exports.getFlow = getFlow;
