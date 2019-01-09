const { writeFileAsync, getArgs } = require('../utils');
const { loadConfigFile, getToken, revokeToken, getFlow } = require('../common');


async function run(args) {
    args = getArgs(args);
    const configFile = await loadConfigFile(args.project);
    let stageConfig = configFile.stages[args.stage];

    stageConfig = await getToken(stageConfig);
    const body = await getFlow(stageConfig);
    stageConfig = await revokeToken(stageConfig);

    const flowId = 'FLOW_ID';
    body.id = flowId;
    body.disabled = false;
    body.nodes.forEach(node => {
        node.z = flowId;
        node.credentials = undefined;
    });

    const newFlowFileContent = JSON.stringify(body, null, 4);
    await writeFileAsync(configFile.flowFile, newFlowFileContent, 'utf8');
}

module.exports = run;
