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
            parallel {
                     stage('NMP Dependency Check') {
                        steps {
                            container('nodejs'){
                                sh 'npm audit --audit-level=critical'
                            }
                        }
                    }
                    stage('OWASP Dependency Check') {
                        steps {
                            dependencyCheck additionalArguments: '''
                            --scan \'./\'
                            --out \'./\'
                            --format \'ALL\'
                            --prettyPrint''', nvdCredentialsId: 'owasp-key', odcInstallation: 'owasp-depCheck-12'
                            dependencyCheckPublisher failedTotalCritical: 1, pattern: '/home/jenkins/agent/workspace/handson_solar-app_feature_feat-4/dependency-check-report.xml', stopBuild: true
                            archiveArtifacts artifacts: '/home/jenkins/agent/workspace/handson_solar-app_feature_feat-4/dependency-check-jenkins.html', followSymlinks: false
                        }
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
