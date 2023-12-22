import express from 'express'
import os from 'os'
import cluster from 'cluster';
import { setupNode } from './node-behavior.js'

const PORT = 3000

const app = express()
let workers = []

const logWorkerMessage = (worker) => (message) => 
    console.log(`[worker-message][pid=${worker.process.pid}] ${message}`)

function generateWorkers(workerCount) {
    for(let i = 0; i < workerCount; i ++) {
        workers.push(cluster.fork())
        console.log(`worker ${workers[i].process.pid} started`)
        workers[i].on('message', logWorkerMessage(workers[i]))
    }
}

function startNewWorker() {
    console.log('starting new worker')
    workers.push(cluster.fork())
    workers[workers.length - 1].on('message', logWorkerMessage(workers[workers.length - 1]))
}

function setupWorkerProcesses() {
    const coreCount = os.cpus().length
    console.log(`setting up cluster with ${coreCount} nodes`);

    generateWorkers(coreCount)

}

function setupServer() {
    if(cluster.isPrimary) {
        setupWorkerProcesses()
    } else {
        setupNode(app, PORT)
    }
}

cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died with code ${code}\n${signal}`)
    startNewWorker()
})

setupServer()

export { app }