/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

class LocalScope {
    constructor () {
        this.data = []
        this.observerIds = []
        this.observer = []
        this.observerId = 0
        this.paused = false
        this.pauseQueue = []
    }

    pause() {
        this.paused = true
    }
    
    resume() {
        this.paused = false
        for (var i = 0; i < this.pauseQueue.length; i++) {
            this.notify(this.pauseQueue[i])
        }
        this.pauseQueue = []
    }
    
    getIds() {
        let result = []
        for (var id in this.data) {
            result.push(id)
        }
        return result
    }
    
    get(id) {
        return this.data[id]
    }
    
    set(id, to) {
        if (this.data[id] !== to) {
            this.unobserveReferences(id)
            this.data[id] = to
            this.notify(id)
            this.observeReferences(id, to)
        }
    }
    
    observeReferences(id, value) {
        if (value instanceof _api.engine.binding.Reference) {
            $api.debug(9, "Observing: " + JSON.stringify(value.path))
            if (!this.observerIds[id]) {
                this.observerIds[id] = []
            }
            this.observerIds[id].push(value)
            this.observerIds[id].push(value.observe(() => {
                if (!this.paused) {
                    this.notify(id)
                } else if (this.pauseQueue.indexOf(id) == -1) {
                    this.pauseQueue.push(id)
                }
            }))
        } else {
            // Recursion
            if (value instanceof Array) {
                for (var i = 0; i < value.length; i++) {
                    this.observeReferences(id, value[i])
                }
            } else if (typeof value == "object") {
                for (var key in value) {
                    this.observeReferences(id, value[key])
                }
            }
        }
    }
    
    unobserveReferences(id) {
        if (this.observerIds[id]) {
            for (var i = 0; i < this.observerIds[id].length; i += 2) {
                let reference = this.observerIds[id][i]
                let observerId = this.observerIds[id][i + 1]
                $api.debug(9, "Unobserving: " + JSON.stringify(reference.path))
                reference.unobserve(observerId)
            }
            this.observerIds[id] = []
        }
    }
    
    destroy(id) {
        // If a reference was previously in localScope, unobserve it
        if (this.data[id] instanceof _api.engine.binding.Reference) {
            this.data[id].unobserve(this.observerIds[id])
        }
        
        // Purge the id from data
        delete this.data[id]
    }
    
    observe(id, callback) {
        $api.debug(3, "LocalScope observer for " + id + " registered")
        if(!this.observer[id]) {
            this.observer[id] = []
        }
        this.observer[id].push({ id: this.observerId, callback: callback })
        return this.observerId++
    }
    
    unobserve(id) {
        var found = false
        for (var name in this.observer) {
            for (var index in this.observer[name]) {
                if (this.observer[name][index].id === id) {
                    this.observer[name].splice(index, 1)
                    // Break outer
                    found = true
                    // Break inner
                    break;
                }
            }
            if (found) {
                break
            }
        }
    }
    
    notify(id) {
        for (var i = 0; this.observer[id] && i < this.observer[id].length; i++) {
            this.observer[id][i].callback()
        }
    }
}

/*  export class  */
_api.engine.LocalScope = LocalScope
