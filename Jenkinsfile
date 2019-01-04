pipeline {
    agent {
        docker 'node'
    }

    stages {
        stage('Prepare publish to NPM') {
            when {
                expression { env.BRANCH_NAME == 'master' }
            }
            steps {
                withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'npm-public-registry-credentials', usernameVariable: 'NPM_URL', passwordVariable: 'NPM_AUTH_TOKEN']]) {
                    sh "echo '//$NPM_URL/:_authToken=$NPM_AUTH_TOKEN' >> .npmrc"
     	        }
                stash name: "npm_config", includes: ".npmrc"
            }
        }
        stage('Publish to NPM') {
            when {
                expression { env.BRANCH_NAME == 'master' }
            }
            steps {
                unstash "npm_config"
                sh 'npm publish'
            }
        }
    }
}