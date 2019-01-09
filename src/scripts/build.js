const path = require("path");
const os = require('os');

const { readFileAsync, writeFileAsync, getArgs, resolvePath } = require('../utils');
const { loadConfigFile, getFunctionNode } = require('../common');

async function run(args) {
    args = getArgs(args);
    const configFile = await loadConfigFile(args.project);

    const flowFileContent = JSON.parse(await readFileAsync(configFile.flowFile));



    const functionDir = configFile.functionsDir ? configFile.functionsDir : 'functions';
    const promises = configFile.functionBindings.map(async (binding) => {
        const functionPath = resolvePath(configFile.directory, functionDir, binding.functionFileName);

        let functionContent = (await readFileAsync(functionPath));
        functionContent = functionContent.toString('utf8');
        functionContent = functionContent.replaceAll(os.EOL, '\n');


        const node = getFunctionNode(flowFileContent, binding.functionId);
        node.func = functionContent;
    });
    await Promise.all(promises);

    const newFlowFileContent = JSON.stringify(flowFileContent, null, 4);
    await writeFileAsync(configFile.flowFile, newFlowFileContent, 'utf8');
}

module.exports = run;
