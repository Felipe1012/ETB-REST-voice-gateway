const _ = require('lodash');
const { kubernetes } = require("../../services");
async function pods(req, res, next) {
    try {
        kubernetes.k8sClient.api.v1.namespaces(process.env.NAMESPACE).pods.get({ qs: { labelSelector: 'release=vgw-dashboard' } }).then((data) => {
            response = data.body.items.map(item => ({
                name: item.metadata.name,
                app: item.metadata.labels.app,
                component: item.metadata.labels.component,
                phase: item.status.phase
            }))
            res.send(response);
        }).catch((error) => {
            console.log(error)
            next(error);
        });
    } catch (error) {
        next(error);
    }
}

async function tenants(req, res, next) {
    try {
        kubernetes.k8sClient.api.v1.namespaces(process.env.NAMESPACE).secrets.get({ qs: {fieldSelector: 'metadata.name=tenantconfig' } }).then((data) => {
            response = data.body.items.map(item => ({
                data: JSON.parse(Buffer.from(item.data.tenantConfig, 'base64').toString())
            }))
            res.send(response[0].data.tenants);
        }).catch((error) => {
            console.log(error)
            next(error);
        });
    } catch (error) {
        next(error);
    }
}

async function applyTenant(req, res, next) {
  try {
    kubernetes.k8sClient.api.v1.namespaces(process.env.NAMESPACE).secrets.get({ qs: {fieldSelector: 'metadata.name=tenantconfig' } }).then(async (data) => {
            tenants = data.body.items.map(item => ({
                data: JSON.parse(Buffer.from(item.data.tenantConfig, 'base64').toString())
            }))
	    tenants = tenants[0].data.tenants
	    tenants.push(req.body)
	    tenants = Buffer.from(JSON.stringify({tenants: tenants})).toString('base64')
	    try {
            	const create = await kubernetes.k8sClient.api.v1.namespaces(process.env.NAMESPACE).secrets.post({ body: {"kind":"Secret","apiVersion":"v1","metadata":{"name":"tenantconfig"},"data":{"tenantConfig": tenants}} })
            	console.log('Create:', create)
		res.status(201).json({})
	    } catch (err){
		if (err.code !== 409) throw err
    		const replace = await kubernetes.k8sClient.api.v1.namespaces(process.env.NAMESPACE).secrets('tenantconfig').put({ body: {"kind":"Secret","apiVersion":"v1","metadata":{"name":"tenantconfig"},"data":{"tenantConfig": tenants}} })
                console.log('Replace:', replace)
                await kubernetes.k8sClient.api.v1.namespaces(process.env.NAMESPACE).pods.delete({ qs: { labelSelector: 'app=vgw' } })
		res.status(200).json({})
	    }
    }).catch((error) => {
            console.log(error)
            next(error);
    }); 
    res.status(204).json({})
  } catch (err) {
      next(error);
  }
}

async function delTenant(req, res, next) {
  const { id } = req.params;

   try {
    kubernetes.k8sClient.api.v1.namespaces(process.env.NAMESPACE).secrets.get({ qs: {fieldSelector: 'metadata.name=tenantconfig' } }).then(async (data) => {
            tenants = data.body.items.map(item => ({
                data: JSON.parse(Buffer.from(item.data.tenantConfig, 'base64').toString())
            }))
            tenants = tenants[0].data.tenants
            tenants_filtered = _.filter(tenants, function(tenant){ return tenant.tenantURI !== id });
	    if(tenants == tenants_filtered){
	    	res.status(404).json({})
		return 
   	    }
	    tenants = tenants_filtered
            tenants = Buffer.from(JSON.stringify({tenants: tenants})).toString('base64')
            try {
                const create = await kubernetes.k8sClient.api.v1.namespaces(process.env.NAMESPACE).secrets.post({ body: {"kind":"Secret","apiVersion":"v1","metadata":{"name":"tenantconfig"},"data":{"tenantConfig": tenants}} })
                console.log('Create:', create)
                res.status(201).json({})
            } catch (err){
                if (err.code !== 409) throw err
                const replace = await kubernetes.k8sClient.api.v1.namespaces(process.env.NAMESPACE).secrets('tenantconfig').put({ body: {"kind":"Secret","apiVersion":"v1","metadata":{"name":"tenantconfig"},"data":{"tenantConfig": tenants}} })
                console.log('Replace:', replace)
		await kubernetes.k8sClient.api.v1.namespaces(process.env.NAMESPACE).pods.delete({ qs: { labelSelector: 'app=vgw' } })
                res.status(200).json({})
            }
    }).catch((error) => {
            console.log(error)
            next(error);
    });
    res.status(204).json({})
  } catch (err) {
      next(error);
  }
}

module.exports = {
    pods,
    applyTenant,
    tenants,
    delTenant
};
