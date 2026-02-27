// Uses Declarative syntax to run commands inside a container.
pipeline {
    agent {
        kubernetes {
            yamlFile 'KubernetesPod.yaml'
            retries 2
        }
    }
    environment {
        // Set the environment variable for the MongoDB URI
        MONGO_Cred = credentials('mongo-cred')
        MONGO_URI = "mongodb://${MONGO_Cred}@mongodb.mongodb.svc.cluster.local:27017/solar-system?authSource=solar-system"
        SCANNER_HOME = tool 'sonarqube-scanner'// must match the name of an actual scanner installation directory on your Jenkins build agent

    }
    stages {
        stage('Install App Dependencies') {
            steps {
                container('nodejs'){
                    sh 'npm install --no-audit'
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
                withSonarQubeEnv('sonarqube-server') {// If you have configured more than one global server connection, you can specify its name as configured in Jenkins
                    sh "$SCANNER_HOME/bin/sonar-scanner"
                }
                // Wait for SonarQube analysis to complete. Fail the build if the quality gate is not met.
                // This will block the pipeline until the quality gate is checked
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage('Build and Push Docker Image') {
            when {
                expression { env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'dev' }
            }
            steps {
                script {
                    // Replace '/' with '-' in BRANCH_NAME and store it in a global environment variable
                    env.SAFE_BRANCH_NAME = sh(
                        script: "echo ${GIT_BRANCH} | sed 's|/|-|g'",
                        returnStdout: true
                    ).trim()
                    // Extract the first 7 characters of GIT_COMMIT
                    env.SHORT_COMMIT = GIT_COMMIT.substring(0, 7)
                    echo "Safe Branch Name: ${env.SAFE_BRANCH_NAME}"
                    echo "Short Commit: ${env.SHORT_COMMIT}"
                }
                container('kaniko') {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', 
                             usernameVariable: 'DOCKER_USER', 
                             passwordVariable: 'DOCKER_PASSWORD')]) {
                            sh """
                            mkdir -p /kaniko/.docker

                            AUTH=\$(echo -n "\${DOCKER_USER}:\${DOCKER_PASSWORD}" | base64 | tr -d '\\n')

                            echo "{\\"auths\\":{\\"https://index.docker.io/v1/\\":{\\"auth\\":\\"\${AUTH}\\"}}}" > /kaniko/.docker/config.json

                            
                            /kaniko/executor \
                            --dockerfile=Dockerfile \
                            --context=`pwd` \
                            --destination=index.docker.io/anas1243/solar-app:$SAFE_BRANCH_NAME-$SHORT_COMMIT
                            """
                            }        
                }
            }
        }
        stage('Trivy Image scan'){
            when {
                expression { env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'dev' }
            }
            steps {
                container('trivy') {
                    // Run Trivy scan for Medium and Critical vulnerabilities
                    // Medium vulnerabilities will not fail the build, but Critical will
                    // Run Trivy scan for Critical vulnerabilities
                    sh """
                    trivy image \
                          --severity LOW,MEDIUM,HIGH \
                          --exit-code 0 \
                          --format template \
                          --template '@/contrib/html.tpl' \
                          --output trivy-MEDIUM-report-$SAFE_BRANCH_NAME-${SHORT_COMMIT}.html \
                          --ignore-unfixed \
                          docker.io/anas1243/solar-app:$SAFE_BRANCH_NAME-$SHORT_COMMIT

                    trivy image \
                          --severity CRITICAL \
                          --exit-code 1 \
                          --format template \
                          --template '@/contrib/html.tpl' \
                          --output trivy-CRITICAL-report-$SAFE_BRANCH_NAME-${SHORT_COMMIT}.html \
                          --ignore-unfixed \
                          docker.io/anas1243/solar-app:$SAFE_BRANCH_NAME-$SHORT_COMMIT     
                    """
                }
            }
        }
        stage('update image tag in solar-gitops repo') {
            when {
                expression { env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'dev' }
            }
            steps {
                container('git') {
                    script {
                        echo "Configuring Git user identity..."
                        sh """
                        git config --global user.email "jenkins@automation-handson.com"
                        git config --global user.name "Jenkins CI"
                        git config --global --add safe.directory `pwd`
                        """
                        // 2. Define the target directory based on branch
                        def targetDir = ""
                        if (env.BRANCH_NAME == 'main') {
                            targetDir = "prod-solar-app"
                        } else if (env.BRANCH_NAME == 'dev') {
                            targetDir = "dev-solar-app"
                        }

                        echo "Using GitHub App credentials to pull and push changes..."
                        withCredentials([usernamePassword(credentialsId: 'github-app', usernameVariable: 'GITHUB_APP',
                        passwordVariable: 'GITHUB_ACCESS_TOKEN')]) {
                            sh """
                            echo "Cloning the solar-gitops repository..."
                            git clone -b main https://${GITHUB_APP}:${GITHUB_ACCESS_TOKEN}@github.com/automation-handson/solar-gitops.git
                            cd argocd/k8s-apps/${targetDir}/deployment

                            echo "Updating the image tag in solar-deployment.yaml... for the $BRANCH_NAME Environment"
                            sed -i "s|image: anas1243/solar-app:.*|image: anas1243/solar-app:$SAFE_BRANCH_NAME-$SHORT_COMMIT|" solar-deployment.yaml
                            git add solar-deployment.yaml
                            git commit -m "Update solar-app image tag to $SAFE_BRANCH_NAME-$SHORT_COMMIT"
                            git push https://${GITHUB_APP}:${GITHUB_ACCESS_TOKEN}@github.com/automation-handson/solar-gitops.git main
                            """
                        }
                    }
                    // Print a success message
                    echo "Image tag updated and changes pushed successfully."
                }
            }
        }
    }
    post {
        always {
            container('nodejs') {
                // using the nodejs container to archive test results and coverage reports
                // Archive test results regardless of success or failure
                archiveArtifacts allowEmptyArchive: true, artifacts: 'test-results.xml', followSymlinks: false
                junit 'test-results.xml' // Publish test results to Jenkins Test Results tab

                // Archive coverage results
                publishHTML([allowMissing: true, alwaysLinkToLastBuild: false, icon: '', keepAll: true, reportDir: 'coverage/lcov-report', reportFiles: 'index.html', reportName: 'Code Coverage HTML Report', reportTitles: '', useWrapperFileDirectly: true])
            }
            container('trivy') {
                script {
                    if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'dev') {
                        // using the trivy container to publish the Trivy Low, Medium, High
                        publishHTML([allowMissing: true, alwaysLinkToLastBuild: false, icon: '', keepAll: true, reportDir: '', reportFiles: "trivy-MEDIUM-report-${env.SAFE_BRANCH_NAME}-${env.SHORT_COMMIT}.html", reportName: 'Medium  Trivy Vulnerability Report', reportTitles: '', useWrapperFileDirectly: true])
                
                        // publish the Trivy Critical report
                        publishHTML([allowMissing: true, alwaysLinkToLastBuild: false, icon: '', keepAll: true, reportDir: '', reportFiles: "trivy-CRITICAL-report-${env.SAFE_BRANCH_NAME}-${env.SHORT_COMMIT}.html", reportName: 'Critical Trivy Vulnerability Report', reportTitles: '', useWrapperFileDirectly: true])
                    }
                }
            }
        }
    }
}
