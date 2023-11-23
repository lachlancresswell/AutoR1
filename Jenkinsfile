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
        stage('Build') { 
            steps {
                sh 'npm run build' 
            }
        }
    }
}