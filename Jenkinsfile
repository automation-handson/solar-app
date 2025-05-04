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
                    // commented out as it takes a long time to run
                    // stage('OWASP Dependency Check') {
                    //     steps {
                    //         dependencyCheck additionalArguments: '''
                    //         --scan \'./\'
                    //         --out \'./\'
                    //         --format \'ALL\'
                    //         --prettyPrint''', nvdCredentialsId: 'owasp-key', odcInstallation: 'owasp-depCheck-12'
                    //         dependencyCheckPublisher failedTotalCritical: 1, pattern: 'dependency-check-report.xml', stopBuild: true
                               // export also the junit.xml file to be visible in Jenkins test tab in blue ocean
                    //         junit testResults: 'dependency-check-junit.xml'
                    //         archiveArtifacts artifacts: 'dependency-check-jenkins.html', followSymlinks: false
                    //     }
                    // }
            }
        }
        stage('NMP Test') {
            steps {
                container('nodejs'){
                    sh 'npm test'
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
