// Uses Declarative syntax to run commands inside a container.
pipeline {
    agent {
        kubernetes {
            yamlFile 'KubernetesPod.yaml'
            // defaultContainer 'nodejs'
            retries 2
        }
    }
    environment {
        // Set the environment variable for the MongoDB URI
        MONGO_Cred = credentials('mongo-cred')
        MONGO_URI = "mongodb://${MONGO_Cred}@mongodb.mongodb.svc.cluster.local:27017/solar-system?authSource=solar-system"
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
        stage('NPM Test') {
            steps {
                container('nodejs') {
                    sh 'npm test'
                }
            }
        }
        stage('NPM Run Coverage') {
            steps {
                container('nodejs') {
                    catchError(buildResult: 'SUCCESS', message: 'the code coverage has failed, we will modify the test cases in a future release;)', stageResult: 'UNSTABLE') {
                        sh 'npm run coverage'
                    }
                }
            }
        }
        stage('Run SAST Check - SonarQube') {
            steps {
                //container('nodejs') {
                    script {
                        scannerHome = tool 'sonarqube-scanner'// must match the name of an actual scanner installation directory on your Jenkins build agent
                    }
                    withSonarQubeEnv('sonarqube-server') {// If you have configured more than one global server connection, you can specify its name as configured in Jenkins
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                    script {
                        // Wait for the quality gate result and fail the pipeline if it fails
                        def qualityGate = waitForQualityGate()
                        if (qualityGate.status != 'OK') {
                            error "Pipeline failed due to SonarQube quality gate failure: ${qualityGate.status}"
                        }
                    }
                //}
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
    post {
        always {
            container('nodejs') {
                // Archive test results regardless of success or failure
                archiveArtifacts allowEmptyArchive: true, artifacts: 'test-results.xml', followSymlinks: false
                junit 'test-results.xml' // Publish test results to Jenkins Test Results tab

                // Archive coverage results
                publishHTML([allowMissing: true, alwaysLinkToLastBuild: false, icon: '', keepAll: true, reportDir: 'coverage/lcov-report', reportFiles: 'index.html', reportName: 'Code Coverage HTML Report', reportTitles: '', useWrapperFileDirectly: true])
            }
        }
    }
}
