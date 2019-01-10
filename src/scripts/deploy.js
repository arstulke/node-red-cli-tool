const {
  readFileAsync,
  httpRequest,
  getArgs
} = require('../utils');
const {
  loadConfigFile,
  getToken,
  revokeToken,
  getFlow,
  getFlowSearchRegex
} = require('../common');

async function createFlow(stageConfig) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + stageConfig.token
  };

  const body = {
    id: 'empty_id',
    label: 'empty label',
    info: `sub-project-id: "${stageConfig.flowTextId}"`,
    disabled: false,
    nodes: []
  };

  const res = await httpRequest('POST', stageConfig.url + '/flow', headers, body);
  const newFlowId = (await res.json()).id;
  return newFlowId;
}


async function run(args) {
  args = getArgs(args);
  const configFile = await loadConfigFile(args.project);
  let stageConfig = configFile.stages[args.stage];

  const flowFileContent = JSON.parse(await readFileAsync(configFile.flowFile));

  stageConfig = await getToken(stageConfig);

  try {
    await getFlow(stageConfig);
  } catch (e) {
    const newFlowId = await createFlow(stageConfig);

    console.warn(`` +
      `The specified flow ${stageConfig.flowTextId} was not found on stage '${stageConfig.url}'.\n` +
      `A new flow with the id '${newFlowId}' was created.\n\n` +
      `You may have to specify credentials in the flow nodes.`);

    stageConfig.flowId = newFlowId;
  }

  flowFileContent.id = stageConfig.flowId;
  flowFileContent.nodes.forEach((node) => {
    node.z = stageConfig.flowId;
  });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + stageConfig.token,
    'Node-RED-API-Version': 'v2'
  };
  const flowsRes = await httpRequest('GET', stageConfig.url + '/flows', headers);
  const flows = await flowsRes.json();

  const newFlows = {
    rev: flows.rev,
    flows: []
  };
  flows.flows.forEach((remoteNode) => {
    if (remoteNode) {
      if (remoteNode.id === stageConfig.flowId) {
        let info = flowFileContent.info;
        if (!getFlowSearchRegex(stageConfig).test(info)) {
          info = `sub-project-flow: "${stageConfig.flowTextId}"\n\n` + info;
        }

        Object.assign(remoteNode, {
          info: info,
          label: flowFileContent.label,
          disabled: flowFileContent.disabled
        });
        newFlows.flows.push(remoteNode);

        flowFileContent.nodes.forEach((localNode) => {
          if (!localNode.wires) {
            localNode.wires = [];
          }

          newFlows.flows.push(localNode);
        });
        return;
      }

      if (remoteNode.z === stageConfig.flowId) {
        return;
      }
    }

    newFlows.flows.push(remoteNode);
  });

  const newFlowsHeaders = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + stageConfig.token,
    'Node-RED-API-Version': 'v2',
    'Node-RED-Deployment-Type': 'flows'
  };
  const newFlowsRes = await httpRequest('POST', stageConfig.url + '/flows', newFlowsHeaders, newFlows);
  const newFlowsResBody = await newFlowsRes.json();

  stageConfig = await revokeToken(stageConfig);
}

module.exports = run;
