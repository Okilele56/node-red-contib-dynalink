module.exports = function(RED) {
    "use strict";

    var fs = require('fs');
    var os = require('os') 

    function setFlow(node, msg, type) {
        let fileName = RED.settings.userDir+'/flows_'+os.hostname+'.json'
        

        if(RED.settings.hasOwnProperty('flowFile')) {
            fileName =  RED.settings.userDir+'/'+RED.settings.flowFile
        }

        fs.readFile(fileName, 'utf8', (err, jsonString) => {
            if (err) {
                console.log("File read failed:", err)
                return
            }
            let flows = JSON.parse(jsonString)
            if(flows && flows.length>0) {
                let nodeFound = flows.find(element => element.id===node.id);
                
                if(nodeFound && nodeFound.hasOwnProperty('z')) {
                    let result = flows.find(element => element && element.type==='tab' && element.id===nodeFound.z);
                    node.currentflow = result

                    if(type==='in') {
                        msg.toflow = node.currentflow
                    } else {
                        msg.fromflow = node.currentflow
                    }


                    node.send(msg);
                }
            } 
        })

        
    }

    function DynaLinkInNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.event = n.topic

        var handler = function(msg) {
            node.receive(msg);
        }

        RED.events.on(node.event,handler);
        this.on("input", function(msg) {
            if(!node.hasOwnProperty('currentflow')) {
                setFlow(node, msg, 'in')
            } else {
                msg.toflow = node.currentflow
                node.send(msg);
            }
        });
        this.on("close",function() {
            RED.events.removeListener(node.event,handler);
        });
    }

    RED.nodes.registerType("dynalink in",DynaLinkInNode);

    function DynaLinkOutNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.event = n.topic

        this.on("input", function(msg) {

            if(msg.hasOwnProperty('topic') && msg.topic && msg.topic.length>0) {
                node.event = msg.topic
            }
            if(!node.hasOwnProperty('currentflow')) {
                setFlow(node, msg, 'out')
                RED.events.emit(node.event,msg)
            } else {
                msg.fromflow = node.currentflow
                node.send(msg);
                RED.events.emit(node.event,msg)
            }

        });
    }
    RED.nodes.registerType("dynalink out",DynaLinkOutNode);
}