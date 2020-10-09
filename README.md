# Node Red Tool
This is a CLI tool for managing node-red flows and storing them in a VCS like git.

## Terminology
* The serverId is the id of the target server.
* The projectId is the id of the project.
* The flowId is the id of the flow. It is stored in the text description of the flow.

## Usage
### Setup
1. `npm i -g node-red-cli-tool`
2. Create a credentials file named 'node-red.credentials.json' in your project directory with the following template and replace the placeholders:
```
{
  "<serverId>": {
    "projects": {
      "<projectId>": {
        "url": "<url>",
        "username": "<username>",
        "password": "<password>"
      }
    }
  }
}
```
3. Create a project file named 'node-red.config.json' in the '{{projectId}}' directory in your project directory with the following template and replace the placeholders:
```
{
  "id": "<projectId>",
  "flowFile": "flow.json",
  "flowTextId": "<flowId>",
  "stages": {
    "<stageKey>": "<serverId>"
  },
  "functionsDir": "functions",
  "functionBindings": [
    {
      "functionFileName": "<some_function_file_name_1.js>"
      "functionId": "001"
    },
    {
      "functionFileName": "<some_function_file_name_2.js>"
      "functionId": "002"
    }
  ]
}
```


### Commands
| Name    | Befehl                                          | Beschreibung                                                  |
|---------|-------------------------------------------------|---------------------------------------------------------------|
| Fetch   | node-red-tool fetch <subProjectDir> <stageKey>  | Loads the flow file for Subprojects' flow                     |
| Extract | node-red-tool extract <subProjectDir>           | Extracts the functions of the flow file to the function files |
| Build   | node-red-tool build <subProjectDir              | Copies the functions of the functions files in the flow file  |
| Deploy  | node-red-tool deploy <subProjectDir> <stageKey> | Deploys the flow file to the specified server                 |
| Clean   | node-red-tool clean <subProjectDir>             | Removes all functions bodies from the local flow file         |
