// ── gastos-app CI/CD Pipeline (patrón yambo, 2026-09) ─────────────────────
// Jenkins (k3s .22, solo ssh) → ssh BUILD_HOST (.21: docker + registry + kubeconfigs)
//   main/master → build + push → deploy PROD (Hetzner CX33, ns gastos)
//   otras ramas/PRs → pipeline verde sin build/deploy (solo main despliega)
//
// Credenciales Jenkins globales (mismas que yambo):
//   yambo-ssh-key          : SSH private key para BUILD_HOST
//   yambo-build-host       : "root@192.168.1.21"
//   yambo-registry-user    : usuario registry
//   yambo-registry-pass    : password registry
//   yambo-registry-host-prod : "100.111.131.248:5000" (registry .21 vía NetBird,
//                              el que el k3s de Hetzner ya tiene en registries.yaml)
// Kubeconfig Hetzner en BUILD_HOST: /root/.kube/hetzner.yaml

pipeline {
    agent any

    parameters {
        booleanParam(
            name: 'FORCE_PRODUCTION',
            defaultValue: false,
            description: 'Tratar la rama actual como producción (deploy a Hetzner)'
        )
        booleanParam(
            name: 'FORCE_DEPLOY',
            defaultValue: false,
            description: 'Construir y empujar imágenes aunque la rama no sea main'
        )
    }

    environment {
        SSH_KEY          = credentials('yambo-ssh-key')
        BUILD_HOST       = credentials('yambo-build-host')
        REGISTRY_USER    = credentials('yambo-registry-user')
        REGISTRY_PASS    = credentials('yambo-registry-pass')
        REGISTRY         = credentials('yambo-registry-host-prod')
        BACKEND_IMAGE    = "${REGISTRY}/gastos-backend"
        FRONTEND_IMAGE   = "${REGISTRY}/gastos-frontend"
        KUBECONFIG_HETZNER = '/root/.kube/hetzner.yaml'
        NS_PROD          = 'gastos'
        APP_DOMAIN       = 'gastos.cabrasky.net'
        CI_DIR           = '/tmp/gastos-ci'
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Detect Branch & Tag') {
            steps {
                script {
                    env.IS_MAIN = (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master' || params.FORCE_PRODUCTION) ? 'true' : 'false'
                    env.APP_VERSION = sh(
                        script: "grep '\"version\"' frontend/package.json | head -1 | sed 's/.*\"version\": \"\\(.*\\)\".*/\\1/'",
                        returnStdout: true
                    ).trim()
                    env.GIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    if (env.IS_MAIN == 'true') {
                        env.IMAGE_TAG = "${env.APP_VERSION}-${env.GIT_SHORT}"
                    } else {
                        def slug = env.BRANCH_NAME.toLowerCase().replaceAll('[^a-z0-9]+', '-').replaceAll('^-+|-+$', '')
                        env.IMAGE_TAG = "branch-${slug}-${env.GIT_SHORT}"
                    }
                    echo "branch=${env.BRANCH_NAME} is_main=${env.IS_MAIN} tag=${env.IMAGE_TAG}"
                }
            }
        }

        stage('Prepare Build Host') {
            when {
                expression { env.IS_MAIN == 'true' || params.FORCE_DEPLOY }
            }
            steps {
                script {
                    sh """
                        ssh -o BatchMode=yes -o StrictHostKeyChecking=no -i ${SSH_KEY} ${BUILD_HOST} "rm -rf ${CI_DIR} && mkdir -p ${CI_DIR}"
                        tar czf - --exclude=.git --exclude=node_modules . | \\
                          ssh -o BatchMode=yes -o StrictHostKeyChecking=no -i ${SSH_KEY} ${BUILD_HOST} "tar xzf - -C ${CI_DIR}"
                    """
                }
            }
        }

        stage('Build & Push Images') {
            when {
                expression { env.IS_MAIN == 'true' || params.FORCE_DEPLOY }
            }
            steps {
                script {
                    sh """
                        ssh -o BatchMode=yes -o StrictHostKeyChecking=no -i ${SSH_KEY} ${BUILD_HOST} "
                            set -e
                            cd ${CI_DIR}
                            echo ${REGISTRY_PASS} | docker login ${REGISTRY} -u ${REGISTRY_USER} --password-stdin
                            docker build --build-arg GIT_SHA=${env.GIT_SHORT} -t ${BACKEND_IMAGE}:${env.IMAGE_TAG} -t ${BACKEND_IMAGE}:latest -f backend/Dockerfile backend/
                            docker build -t ${FRONTEND_IMAGE}:${env.IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest -f frontend/Dockerfile frontend/
                            docker push ${BACKEND_IMAGE}:${env.IMAGE_TAG}
                            docker push ${BACKEND_IMAGE}:latest
                            docker push ${FRONTEND_IMAGE}:${env.IMAGE_TAG}
                            docker push ${FRONTEND_IMAGE}:latest
                        "
                    """
                }
            }
        }

        stage('Deploy Production (Hetzner)') {
            when {
                expression { env.IS_MAIN == 'true' }
            }
            steps {
                script {
                    sh """
                        ssh -o BatchMode=yes -o StrictHostKeyChecking=no -i ${SSH_KEY} ${BUILD_HOST} "
                            set -e
                            cd ${CI_DIR}/k8s/overlays/production
                            KUBECONFIG=${KUBECONFIG_HETZNER} kubectl kustomize . | \\
                              sed -e 's|100.111.131.248:5000/gastos-backend:latest|${BACKEND_IMAGE}:${env.IMAGE_TAG}|g' \\
                                  -e 's|100.111.131.248:5000/gastos-frontend:latest|${FRONTEND_IMAGE}:${env.IMAGE_TAG}|g' | \\
                              awk -f ${CI_DIR}/k8s/scripts/strip-secrets.awk | \\
                              KUBECONFIG=${KUBECONFIG_HETZNER} kubectl apply -f -
                            KUBECONFIG=${KUBECONFIG_HETZNER} kubectl rollout status deployment/backend -n ${NS_PROD} --timeout=300s
                            KUBECONFIG=${KUBECONFIG_HETZNER} kubectl rollout status deployment/frontend -n ${NS_PROD} --timeout=300s
                        "
                    """
                    echo "✅ Producción desplegada: https://${APP_DOMAIN} (imagen ${env.IMAGE_TAG})"
                }
            }
        }
    }

    post {
        failure {
            echo '❌ Pipeline fallido — revisar logs'
        }
        success {
            script {
                if (env.IS_MAIN == 'true') {
                    echo "✅ gastos-app desplegado (${env.IMAGE_TAG}): https://${APP_DOMAIN}"
                } else {
                    echo "Rama ${env.BRANCH_NAME}: sin deploy (solo main despliega a producción)"
                }
            }
        }
    }
}
