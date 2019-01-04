const path = require("path");
const os = require('os');

const { readFileAsync, writeFileAsync, getArgs } = require('./utils');
const { loadConfigFile, getFunctionNode } = require('./common');


async function run() {
    const args = getArgs();
    const configFile = await loadConfigFile(args.project);
    
    const flowFileContent = JSON.parse(await readFileAsync(configFile.flowFile));

    const functionDir = configFile.functionsDir ? configFile.functionsDir : 'functions';
    const promises = configFile.functionBindings.map(async (binding) => {
        const node = getFunctionNode(flowFileContent, binding.functionId);
        let functionBody = node.func;
        functionBody = functionBody.replaceAll('\n', os.EOL);

        const functionPath = path.resolve(__dirname, '..', configFile.directory, functionDir, binding.functionFileName);
        await writeFileAsync(functionPath, functionBody, 'utf8');
    });
    await Promise.all(promises);
}

run(); 