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
    }

    post { 
        always { 
            cleanWs()
        }
    }
}