pipeline {
  agent any

  parameters {
    string(name: 'IMAGE_NAME', defaultValue: 'filewise', description: 'Docker image repository and name')
    string(name: 'IMAGE_TAG', defaultValue: 'latest', description: 'Docker image tag')
    booleanParam(name: 'PUSH_IMAGE', defaultValue: false, description: 'Push the built image to a registry')
  }

  environment {
    DOCKER_IMAGE = "${params.IMAGE_NAME}:${params.IMAGE_TAG}"
  }

  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Build Docker image') {
      steps {
        sh 'docker build --pull -t "$DOCKER_IMAGE" .'
      }
    }

    stage('Push Docker image') {
      when {
        expression { return params.PUSH_IMAGE }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-registry', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASSWORD')]) {
          sh '''
            echo "$DOCKER_PASSWORD" | docker login --username "$DOCKER_USER" --password-stdin
            docker push "$DOCKER_IMAGE"
            docker logout
          '''
        }
      }
    }
  }

  post {
    always {
      cleanWs(deleteDirs: true, notFailBuild: true)
    }
  }
}
