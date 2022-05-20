module.exports = {
  apps : [{
    name   : "keva-proxy",
    script : "./proxy.js",
    exec_mode: "cluster",
    instances: 2,
  }]
}
