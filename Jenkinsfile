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
        stage('Test npm') {
            steps {
                container('nodejs'){
                    sh 'npm -v'
                    sh "pwd"
                    sh "ls -R"
                    sh "ls -R /home/jenkins/agent"
                    // sh "ls -R /app"
                }
            }
        }
        stage('test Kaniko') {
            steps {
                container('kaniko') {
                    sh """
                    /kaniko/executor \
                    --dockerfile=Dockerfile \
                    --context=`pwd` \
                    --destination=docker.io/anas1243/solar-app:latest
                    """
                }
            }
        }
    }
}
