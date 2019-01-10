const {
  writeFileAsync,
  getArgs
} = require('../utils');
const {
  loadConfigFile,
  getToken,
  revokeToken,
  getFlow
} = require('../common');


async function run(args) {
  args = getArgs(args);
  const configFile = await loadConfigFile(args.project, args, true);

  Object.assign(configFile, await getToken(configFile));
  const body = await getFlow(configFile);
  Object.assign(configFile, await revokeToken(configFile));

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
