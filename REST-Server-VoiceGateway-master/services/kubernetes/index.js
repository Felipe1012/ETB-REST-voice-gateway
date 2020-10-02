let k8sClient = null;
const kubernetesConfig = require('kubernetes-client').config;
let k8sClientConfig = null;
try {
    if (process.env.NODE_ENV === 'development') {
        k8sClientConfig = kubernetesConfig.fromKubeconfig();
    } else {
        k8sClientConfig = kubernetesConfig.getInCluster();
    }
} catch (error) {
    console.log(error)
}
if (k8sClientConfig) {
    const KubernetesClient = require('kubernetes-client').Client;
    k8sClient = new KubernetesClient({ config: k8sClientConfig });
    k8sClient.loadSpec()
}


module.exports = {
    k8sClient
};
