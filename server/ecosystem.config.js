module.exports = {
  apps : [{
    name   : "keva-cloud",
    script : "./main.js"
  },{
    name   : "keva-proxy",
    script : "./proxy.js",
    exec_mode: "cluster",
    instances: 2,
  }]
}
