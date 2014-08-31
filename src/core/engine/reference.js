/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
    
class Reference {
    /*  constructor for a Tree node  */
    constructor (adapter, path) {
        this.adapter = adapter
        this.path = path
    }
    
    setElement (element) {
        this.element = element
    }
    
    setModel (model) {
        this.model = model
    }
    
    observe (callback) {
        let observerId = 0
        if (this.adapter.type() == "model") {
            observerId = this.adapter.observe(this.model, this.path, callback)
        } else if (this.adapter.type() == "view") {
            observerId = this.adapter.observe(this.element, this.path, callback)
        } else {
            throw _api.util.exception("Unknown adapter type: " + this.adapter.type())
        }
        return observerId
    }
    
    unobserve (observerId) {
        this.adapter.unobserve(observerId)
    }
    
    getValue() {
        if (this.adapter.type() == "model") {
            return this.adapter.getValue(this.model, this.path)
        } else if (this.adapter.type() == "view") {
            return this.adapter.getValue(this.element, this.path)
        } else {
            throw _api.util.exception("Unknown adapter type: " + this.adapter.type())
        }
    }
    
    set (value) {
        if (this.adapter.type() == "model") {
            this.adapter.set(this.model, this.path, value)
        } else if (this.adapter.type() == "view") {
            this.adapter.set(this.element, this.path, value)
        } else {
            throw _api.util.exception("Unknown adapter type: " + this.adapter.type())
        }
    }
    
    type () {
        return this.adapter.type()
    }
}

/*  export class  */
_api.engine.binding.Reference = Reference