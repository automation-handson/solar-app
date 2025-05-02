// Uses Declarative syntax to run commands inside a container.
pipeline {
    agent {
        kubernetes {
            yamlFile 'KubernetesPod.yaml'
            // defaultContainer 'nodejs'
            retries 2
        }
    }
    stages {
        stage('Install App Dependencies') {
            steps {
                container('nodejs'){
                    sh 'npm install --no-audit'
                    sh 'ls -la'
                }
            }
        }
        stage('Dependency Check') {
            steps {
                container('nodejs'){
                    sh 'npm audit --audit-level=critical'
                }
            }
        }
        // stage('test Kaniko') {
        //     steps {
        //         container('kaniko') {
        //             sh """
        //             /kaniko/executor \
        //             --dockerfile=Dockerfile \
        //             --context=`pwd` \
        //             --destination=docker.io/anas1243/solar-app:latest
        //             """
        //         }
        //     }
        // }
    }
}
