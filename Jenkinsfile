pipeline {
    agent {
        docker {
            image 'node:20-bullseye'
        }
    }
    stages {
        stage('Install') { 
            steps {
                sh 'npm install' 
            }
        }
        stage('Build') { 
            steps {
                sh 'npm run build' 
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