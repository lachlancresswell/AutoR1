pipeline {
    agent {
        docker {
            image 'node:20-bullseye'
        }
    }
    stages {
        stage('Install') { 
            steps {
                sh 'npm install --registry https://localhost:4873' 
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
}