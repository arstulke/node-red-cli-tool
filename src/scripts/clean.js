const { readFileAsync, writeFileAsync, getArgs } = require('../utils');
const { loadConfigFile, getFunctionNode } = require('../common');

async function run(args) {
    args = getArgs(args);
    const configFile = await loadConfigFile(args.project, args);

    const flowFileContent = JSON.parse(await readFileAsync(configFile.flowFile));

    configFile.functionBindings.forEach((binding) => {
        const node = getFunctionNode(flowFileContent, binding.functionId);
        node.func = "";
    });

    const newFlowFileContent = JSON.stringify(flowFileContent, null, 4);
    await writeFileAsync(configFile.flowFile, newFlowFileContent, 'utf8');
}

module.exports = run;
