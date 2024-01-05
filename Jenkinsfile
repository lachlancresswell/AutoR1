pipeline {
    agent {
        docker {
            image 'node:20-bullseye'
            args  '--net="host"'
        }
    }
    stages {
        stage('Install') { 
            steps {
                sh 'npm install --registry http://verdaccio:4873' 
            }
        }
        stage('Unit Tests') { 
            steps {
                sh 'npx jest unit.test' 
            }
        }
        stage('Integration Tests') { 
            steps {
                sh 'npx jest integration.test' 
            }
        }
        stage('E2E Tests') { 
            steps {
                sh 'npx jest e2e.test' 
            }
        }
        stage('App Test') {
            steps {
                sh 'npx tsc && cp ./src/__tests__/Projects/* ./dist'
                script {
                    def output = sh(script: 'cd dist && node app.js', returnStdout: true).trim()
                    def completedCount = output.count('.......completed')
                    def notInitialisedCount = output.count('Project file is not initialised')

                    if (completedCount != 4 || notInitialisedCount != 1) {
                        error("Unexpected output from App Test: ${output}")
                    }
                }
            }   
        }
    }

    post { 
        always { 
            cleanWs()
        }
    }
}