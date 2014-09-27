/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Johannes Rummel
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

 _api.engine.iterator.mount = (binding, mountPoint) => {
    let template = binding.vars.iterationTree.get("links")[0].get("instances")[0].template[0]
    // Check if template was mounted before and call destroy observer for sockets
    if (template.parentElement) {
        _api.engine.iterator.callSocketRemovalObserver(binding, binding.vars.iterationTree.get("links")[0])
    }
    mountPoint.replaceWith(template)
    _api.engine.iterator.callSocketInsertionObserver(binding, binding.vars.iterationTree.get("links")[0])
 }
 
 _api.engine.iterator.callSocketRemovalObserver = (binding, node) => {
    for (let i = 0; i < node.get("instances").length; i++) {
        let instance = node.get("instances")[i]
        _api.engine.iterator.callSocketRemovalObserverInstance(binding, node, instance)
    }
    
    for (let i = 0; i < node.childs().length; i++) {
        _api.engine.iterator.callSocketRemovalObserver(binding, node.childs()[i])
    }
 }
 
 _api.engine.iterator.callSocketInsertionObserver = (binding, node) => {
    for (let i = 0; i < node.get("instances").length; i++) {
        let instance = node.get("instances")[i]
        _api.engine.iterator.callSocketInsertionObserverInstance(binding, node, instance)
    }
    
    for (let i = 0; i < node.childs().length; i++) {
        _api.engine.iterator.callSocketInsertionObserver(binding, node.childs()[i])
    }
 }
 
 _api.engine.iterator.callSocketRemovalObserverInstance = (binding, node, instance) => {
    if (instance.sockets.length > 0) {
        let keys = []
        // Do not add key, if this is the root node
        if (node.getParent()) {
            keys.push(instance.key)
        }
        // If not node.getParent().getParent() means, that node.get("instance") refers to the instance of root
        while (node.getParent() && node.getParent().getParent() && node.get("instance")) {
            keys.push(node.get("instance").key)
            node = node.getParent()
        }
        for (let i = 0; i < instance.sockets.length; i++) {
            let socket = instance.sockets[i]
            let id = socket.id
            let element = socket.element
            let callbacks = binding.vars.socketRemovalObserver[id]
            if (callbacks) {
                for (let j = 0; j < callbacks.length; j++) {
                    let callback = callbacks[j]
                    callback(keys, element)
                }
            }
        }
    }
 }
 
 _api.engine.iterator.callSocketInsertionObserverInstance = (binding, node, instance) => {
    if (instance.sockets.length > 0) {
        let keys = []
        // Do not add key, if this is the root node
        if (node.getParent()) {
            keys.push(instance.key)
        }
        // If not node.getParent().getParent() means, that node.get("instance") refers to the instance of root
        while (node.getParent() && node.getParent().getParent() && node.get("instance")) {
            keys.push(node.get("instance").key)
            node = node.getParent()
        }
        for (let i = 0; i < instance.sockets.length; i++) {
            let socket = instance.sockets[i]
            let id = socket.id
            let element = socket.element
            let callbacks = binding.vars.socketInsertionObserver[id]
            if (callbacks) {
                for (let j = 0; j < callbacks.length; j++) {
                    let callback = callbacks[j]
                    callback(keys, element)
                }
            }
        }
    }
 }
 
 _api.engine.iterator.init = (binding) => {
    let root = binding.vars.iterationTree
    // Init binding of root instance
    _api.engine.binding.init(binding, root.get("links")[0].get("instances")[0])
    binding.vars.firstLevelIterationObserverIds = []
    for (let i = 0; i < root.childs().length; i++) {
        let observerId = _api.engine.iterator.initInternal(binding, root.childs()[i])
        binding.vars.firstLevelIterationObserverIds.push(observerId)
    }
 }
 
 _api.engine.iterator.shutdown = (binding) => {
    // Opposite of _api.engine.iterator.init in reverse order
    let root = binding.vars.iterationTree
    
    for (let i = 0; i < binding.vars.firstLevelIterationObserverIds.length; i++) {
        let observerId = binding.vars.firstLevelIterationObserverIds[i]
        binding.vars.localScope.unobserve(observerId)
        // Destroy is not necessary, since in shutdownInternal the values (which might be references for when)
        // will be overwritten and the unobserve is done in localScope
    }
    
    for (let i = 0; i < root.childs().length; i++) {
        _api.engine.iterator.shutdownInternal(binding, root.childs()[i])
    }
    _api.engine.binding.shutdown(binding, root.get("links")[0].get("instances")[0])
 }
 
 _api.engine.iterator.initInternal = (binding, node) => {
    // Only observes first level iterations, all others will be 
    // observed as soon as created through instances
    let observerId = binding.vars.localScope.observe(node.get("links")[0].get("sourceId"), () => {
        _api.engine.iterator.changeListener(binding, node.get("links")[0])
    })
    _api.engine.iterator.changeListener(binding, node.get("links")[0])
    return observerId
}

_api.engine.iterator.shutdownInternal = (binding, node) => {
    // Opposite of _api.engine.iterator.initInternal in reverse order
    
    // Reset first level nodes to empty collections or false
    let sourceId = node.get("links")[0].get("sourceId")
    let currentCollection = binding.vars.localScope.get(sourceId)
    if (currentCollection instanceof _api.engine.binding.Reference) {
        currentCollection = currentCollection.getValue()
    }
    currentCollection = currentCollection ? currentCollection : []
    let currentCollectionType = Object.prototype.toString.call(currentCollection)
    
    let newCollection = null
    if (currentCollectionType === "[object Boolean]") {
        newCollection = false
    } else if (currentCollection instanceof Array) {
        newCollection = []
    } else {
        newCollection = {}
    }
    
    binding.vars.localScope.set(sourceId, newCollection)
    
    // Observers are already down, so call the changeListener manually
    _api.engine.iterator.changeListener(binding, node.get("links")[0])
}

 _api.engine.iterator.changeListener = (binding, node) => {
    let newCollection = binding.vars.localScope.get(node.get("sourceId"))
    // Special case for true and false or empty collection
    if (newCollection instanceof _api.engine.binding.Reference) {
        newCollection = newCollection.getValue()
    }
    newCollection = (typeof newCollection === "undefined") ? [] : newCollection
    let oldCollection = node.get("collection")
    node.set("collection", _api.engine.binding.convertToValues(newCollection))
    
    let newCollectionType = Object.prototype.toString.call(newCollection)
    if (newCollectionType === "[object Boolean]") {
        // collection is always initialized with [], so if the boolean arrives for the first time
        // this needs to be interpreted as false
        if (oldCollection.hasOwnProperty("length") && oldCollection.length === 0) {
            oldCollection = false
        }
        if (oldCollection && !newCollection) {
            // Was there, now is not there anymore
            _api.engine.iterator.remove(binding, node, 0)
        } else if (!oldCollection && newCollection) {
            // Was not there, now should be there
            _api.engine.iterator.add(binding, node, { key: 0, value: true })
        }
    } else {
        let changes = _api.engine.iterator.levensthein(oldCollection, newCollection)
        for (let i = 0; i < changes.length; i++) {
            switch (changes[i].action) {
                case "remove":
                    _api.engine.iterator.remove(binding, node, changes[i].key)
                    break
                case "add":
                    _api.engine.iterator.add(binding, node, changes[i].newProperty)
                    break
                case "replace":
                    _api.engine.iterator.replace(binding, node, changes[i].key, changes[i].newValue)
                    break
                default:
                    throw new _api.util.exception("Internal Error: Unknown change action")
            }
        }
    }
 }
 
 _api.engine.iterator.add = (binding, node, property) => {
    let childs = node.get("origin").childs()
    let newInstance = _api.engine.iterator.addInstance(binding, node, property)
    
    // Initialize new children
    for (let j = 0; j < childs.length; j++) {
        let child = childs[j]
        let newChildLink = _api.engine.iterator.initChild(binding, node, child, newInstance)
        node.add(newChildLink)
    }
    
    // Initialize binding for newInstance
    _api.engine.binding.init(binding, newInstance)
    _api.engine.iterator.refreshKeysAdded(binding, node, newInstance, property.key)
 }
 
 _api.engine.iterator.remove = (binding, node, key) => {
    // Find instance
    let oldInstance
    let instances = node.get("instances")
    for (let i = 0; i < instances.length; i++) {
        let instance = instances[i]
        if (instance.key === key) {
            oldInstance = instance
            break
        }
    }
    if (!oldInstance) {
        throw _api.util.exception("Cannot remove key " + key + " because it does not exist")
    }
    
    // Do the opposite of _api.engine.iterator.add in reverse order
    _api.engine.binding.shutdown(binding, oldInstance)
    
    let childs = node.childs()
    for (let i = 0; i < childs.length; i++) {
        let child = childs[i]
        if (child.get("instance") === oldInstance) {
            node.del(child)
            _api.engine.iterator.destroyChild(binding, child)
        }
    }
    
    _api.engine.iterator.removeInstance(binding, node, key, oldInstance)
    _api.engine.iterator.refreshKeysRemoved(binding, node, key)
 }
 
 _api.engine.iterator.replace = (binding, node, key, newValue) => {
    for (let i = 0; i < node.childs().length; i++) {
        let child = node.childs()[i]
        if (child.get("instance").key === key) {
            binding.vars.localScope.set(child.get("sourceId"), newValue)
        }
    }
 }
 
 _api.engine.iterator.addInstance = (binding, link, property) => {
    $api.debug(8, "Adding instance, property.key: " + property.key)
    
    // Template
    let oldTemplate = link.get("template")
    let newTemplate = oldTemplate.clone()
    
    // Template Placeholder
    let oldTemplatePlaceholder = link.get("placeholder")
    let newTemplatePlaceholder = []
    for (let i = 0; i < oldTemplatePlaceholder.length; i++) {
        let oldPlaceholder = oldTemplatePlaceholder[i]
        let selector = _api.util.getPath(oldTemplate, oldPlaceholder)
        let newPlaceholder = selector === "" ? newTemplate : $api.$()(selector, newTemplate)
        let comment = $api.$()("<!-- -->")
        newPlaceholder.replaceWith(comment)
        newTemplatePlaceholder.push(comment)
    }
    
    // Update sockets
    let sockets = link.get("sockets")
    let newSockets = []
    for (let i = 0; i < sockets.length; i++) {
        let socket = sockets[i]
        let element = socket.element
        let selector = _api.util.getPath(oldTemplate, element)
        let newElement = selector === "" ? newTemplate : $api.$()(selector,  newTemplate)
        newSockets.push({ element: newElement, id: socket.id })
    }
    
    // Binding
    let newBinding = link.get("binding").clone()
    let scopes = newBinding.getAll("Scope")
    for (let i = 0; i < scopes.length; i++) {
        let scope =  scopes[i]
        let element = scope.get("element")
        let selector = _api.util.getPath(oldTemplate, element)
        let newElement = selector === "" ? newTemplate : $api.$()(selector, newTemplate)
        if (newElement.length !== 1) {
            throw _api.util.exception("Could not locate element in template clone")
        }
        scope.set("element", newElement)
    }
    
    // ------------
    // | RENAMING |
    // ------------
    
    let bindingRenames = {}
    // Rename all own variables
    let ownVariables = link.get("ownVariables")
    for (let i = 0; i < ownVariables.length; i++) {
        let ownVariable = ownVariables[i]
        bindingRenames[ownVariable] = "temp" + binding.vars.tempCounter.getNext()
    }
    
    // Generate new rename for entry and key
    let entryId = link.get("entryId")
    if (entryId) {
        let newEntryId = "temp" + binding.vars.tempCounter.getNext()
        bindingRenames[entryId] = newEntryId
        // Set the entry in localScope
        binding.vars.localScope.set(newEntryId, property.value)
        entryId = newEntryId
    }
    let keyId = link.get("keyId")
    if (keyId) {
        let newKeyId = "temp" + binding.vars.tempCounter.getNext()
        bindingRenames[keyId] = newKeyId
        // Set the key in localScope
        binding.vars.localScope.set(newKeyId, property.key)
        keyId = newKeyId
    }
    
    // Also rename anything that parent has renamed
    let parentRenames = link.get("instance") ? link.get("instance").bindingRenames : {}
    for (let oldId in parentRenames) {
        bindingRenames[oldId] = parentRenames[oldId]
    }
    
    // Do the renaming
    let variables = newBinding.getAll("Variable")
    for (let i = 0; i < variables.length; i++) {
        let variable = variables[i]
        if (variable.get("ns") !== binding.bindingScopePrefix()) {
            continue 
        }
        for (let bindingRename in bindingRenames) {
            let oldId = bindingRename
            let newId = bindingRenames[oldId]
            if (variable.get("id") === oldId) {
                variable.set("id", newId)
            }
        }
    }
    
    // If afterKey is numeric
    let newKey = (typeof property.afterKey === "undefined" ||
                  property.afterKey % 1 !== 0) ?
                  property.key : parseInt(property.afterKey) + 1
    let newInstance = {
        key: newKey,
        keyId: keyId,
        entryId: entryId, 
        template: newTemplate,
        binding: newBinding,
        bindingRenames: bindingRenames,
        placeholder: newTemplatePlaceholder,
        sockets: newSockets
    }
    
    let instances = link.get("instances")
    // Insert template
    // afterKey === -1 means "insert at front"
    if (typeof property.afterKey !== "undefined" &&
          property.afterKey !== -1 &&
          instances.length > 0) {
        // Search for instance with that key and insert after it
        for (let i = 0; i < instances.length; i++) {
            let instance = instances[i]
            if (instance.key === property.afterKey) {
                instance.template.after(newTemplate)
                break
            }
        }
    } else if (link.get("instance") /* only false if initializing root instance */){
        // link.get("instance") === link.getParent().get("instances")[link.getParent().get("instances").indexOf(link.get("instance")]
        link.get("instance").placeholder[link.get("placeholderIndex")].after(newTemplate)
    }
   
    // Add to instances
    instances.push(newInstance)
    
    // Call sockets
    _api.engine.iterator.callSocketInsertionObserverInstance(binding, link, newInstance)
    
    return newInstance
 }
 
 _api.engine.iterator.refreshKeysAdded = (binding, node, newInstance, keyAdded) => {
    // Check if collection is array
    if (node.get("collection") instanceof Array) {
        // Increase key of all instances greater than keyAdded by one
        let instances = node.get("instances")
        for (let i = 0; i < instances.length; i++) {
            let instance = instances[i]
            if (instance !== newInstance && instance.key >= keyAdded) {
                // Update key
                instance.key = parseInt(instance.key) + 1
                binding.vars.localScope.set(instance.keyId, instance.key)
                // Update references in entry
                let entry = binding.vars.localScope.get(instance.entryId)
                let newEntry = _api.engine.iterator.refreshKeysAddedEntry(entry, [], keyAdded)
                binding.vars.localScope.set(instance.entryId, newEntry)
            }
        }
    }
 }
 
 _api.engine.iterator.refreshKeysAddedEntry = (entry, path, keyAdded) => {
    if (entry instanceof _api.engine.binding.Reference) {
        let newRef = entry.clone()
        let refPath = newRef.getPath()
        // Check if paths fit together
        for (let i = 0; i < path.length; i++) {
            if (refPath[refPath.length - path.length + i] !== path[i]) {
                throw _api.util.exception("Internal error")
            }
        }
        // Check if numeric
        if (refPath[refPath.length - path.length - 1] % 1 !== 0) {
            throw _api.util.exception("Internal error")
        }
        // Increase if necessary
        if (parseInt(refPath[refPath.length - path.length - 1]) >= keyAdded) {
            refPath[refPath.length - path.length - 1] = parseInt(refPath[refPath.length - path.length - 1]) + 1
        }
        newRef.setPath(refPath)
        return newRef
    } else {
        // Recursion
        if (entry instanceof Array) {
            let newArr = []
            for (let i = 0; i < entry.length; i++) {
                let subResult = _api.engine.iterator.refreshKeysAddedEntry(entry[i], [].concat.apply([], [path, i]), keyAdded)
                newArr.push(subResult)
            }
            return newArr
        } else if (typeof entry === "object") {
            let newObj = {}
            for (let key in entry) {
                let subResult = _api.engine.iterator.refreshKeysAddedEntry(entry[key], [].concat.apply([], [path, key]), keyAdded)
                newObj[key] = subResult
            }
            return newObj
        } else {
            return entry
        }
    }
 }
 
 _api.engine.iterator.removeInstance = (binding, link, key, instance) => {
    $api.debug(8, "Removing instance, key: " + key)
    // Do the opposite of everything relevant from _api.engine.iterator.addInstance in reverse order
    
    // Call sockets
    _api.engine.iterator.callSocketRemovalObserverInstance(binding, link, instance)
    
    // Remove from instances
    link.get("instances").splice(link.get("instances").indexOf(instance), 1)
    
    // Remove template
    instance.template.detach()
    
    // Kill the entries in localScope for entry and key (to destroy probable observers)
    if (instance.entryId) {
        binding.vars.localScope.destroy(instance.entryId)
    }
    if (instance.keyId) {
        binding.vars.localScope.destroy(instance.keyId)
    }
 }
 
 _api.engine.iterator.refreshKeysRemoved = (binding, node, keyRemoved) => {
    // Check if collection is array
    if (node.get("collection") instanceof Array) {
        // Reduce key of all instances greater than keyRemoved by one
        let instances = node.get("instances")
        for (let i = 0; i < instances.length; i++) {
            let instance = instances[i]
            if (instance.key > keyRemoved) {
                // Update key
                instance.key = parseInt(instance.key) - 1
                binding.vars.localScope.set(instance.keyId, instance.key)
                // Update references in entry
                let entry = binding.vars.localScope.get(instance.entryId)
                let newEntry = _api.engine.iterator.refreshKeysRemovedEntry(entry, [], keyRemoved)
                binding.vars.localScope.set(instance.entryId, newEntry)
            }
        }
    }
 }
 
 _api.engine.iterator.refreshKeysRemovedEntry = (entry, path, keyRemoved) => {
    if (entry instanceof _api.engine.binding.Reference) {
        let newRef = entry.clone()
        let refPath = newRef.getPath()
        // Check if paths fit together
        for (let i = 0; i < path.length; i++) {
            if (refPath[refPath.length - path.length + i] !== path[i]) {
                throw _api.util.exception("Internal error")
            }
        }
        // Check if numeric
        if (refPath[refPath.length - path.length - 1] % 1 !== 0) {
            throw _api.util.exception("Internal error")
        }
        // Decrease if necessary
        if (parseInt(refPath[refPath.length - path.length - 1]) > keyRemoved) {
            refPath[refPath.length - path.length - 1] = parseInt(refPath[refPath.length - path.length - 1]) - 1
        }
        newRef.setPath(refPath)
        return newRef
    } else {
        // Recursion
        if (entry instanceof Array) {
            let newArr = []
            for (let i = 0; i < entry.length; i++) {
                let subResult = _api.engine.iterator.refreshKeysRemovedEntry(entry[i], [].concat.apply([], [path, i]), keyRemoved)
                newArr.push(subResult)
            }
            return newArr
        } else if (typeof entry === "object") {
            let newObj = {}
            for (let key in entry) {
                let subResult = _api.engine.iterator.refreshKeysRemovedEntry(entry[key], [].concat.apply([], [path, key]), keyRemoved)
                newObj[key] = subResult
            }
            return newObj
        } else {
            return entry
        }
    }
 }
 
 _api.engine.iterator.initChild = (binding, parentLink, node, instance) => {
    let newLink = _api.preprocessor.iterator.initExpandedIterationNode(binding, node, parentLink)
    node.get("links").push(newLink)
    
    newLink.set("instance", instance)
    
    // Change sourceId if appropriate
    if (instance.bindingRenames[newLink.get("sourceId")]) {
        newLink.set("sourceId", instance.bindingRenames[newLink.get("sourceId")])
    }
    
    // Setup observer
    let sourceObserverId = binding.vars.localScope.observe(newLink.get("sourceId"), () => {
        _api.engine.iterator.changeListener(binding, newLink)
    })
    _api.engine.iterator.changeListener(binding, newLink)
    
    // Store observerId
    newLink.set("sourceObserverId", sourceObserverId)
    
    return newLink
 }
 
 _api.engine.iterator.destroyChild = (binding, newLink) => {
    // Do the opposite of _api.engine.iterator.initChild in reverse order
    
    // Unobserve
    binding.vars.localScope.unobserve(newLink.get("sourceObserverId"))
    
    // Reset collection to empty collections or false
    let sourceId = newLink.get("sourceId")
    let currentCollection = binding.vars.localScope.get(sourceId)
    if (currentCollection instanceof _api.engine.binding.Reference) {
        currentCollection = currentCollection.getValue()
    }
    currentCollection = currentCollection ? currentCollection : []
    let currentCollectionType = Object.prototype.toString.call(currentCollection)
    
    let newCollection = null
    if (currentCollectionType === "[object Boolean]") {
        newCollection = false
    } else if (currentCollection instanceof Array) {
        newCollection = []
    } else {
        newCollection = {}
    }
    
    binding.vars.localScope.set(sourceId, newCollection)
    
    // Observers are already down, so call the changeListener manually
    _api.engine.iterator.changeListener(binding, newLink)
    
    // Remove from links of origin
    let originLinks = newLink.get("origin").get("links")
    originLinks.splice(originLinks.indexOf(newLink), 1)
    
    _api.preprocessor.iterator.shutdownExpandedIterationNode(binding, newLink)
 }
 
 _api.engine.iterator.levensthein = (oldCollection, newCollection) => {
    
    // New Collection might contain references
    let newValues = []
    for (let key in newCollection) {
        newValues[key] = _api.engine.binding.convertToValues(newCollection[key])
    }
    
    let result = [];
    // Use levensthein to compare arrays
    if (oldCollection instanceof Array && newCollection instanceof Array) {
        // Levensthein
        let matrix = [];
         
        // increment along the first column of each row
        for (let i = 0; i <= newCollection.length; i++) {
            matrix[i] = [i];
        }
         
        // increment each column in the first row
        for (let j = 0; j <= oldCollection.length; j++) {
            matrix[0][j] = j
        }
         
        // Fill in the rest of the matrix
        for (let i = 1; i <= newCollection.length; i++) {
            for (let j = 1; j <= oldCollection.length; j++) {
                if (_api.util.objectEquals(newValues[i-1], oldCollection[j-1])) {
                    matrix[i][j] = matrix[i-1][j-1];
                } else {
                    matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                            Math.min(matrix[i][j-1] + 1, // insertion
                                                     matrix[i-1][j] + 1)); // deletion
                }
            }
        }
        
        // Reconstruct changes from matrix
        let x = newCollection.length
        let y = oldCollection.length
        
        while (x >= 0 && y >= 0) {
            let current = matrix[x][y];
            let diagonal = x - 1 >= 0 && y - 1 >= 0 ? matrix[x-1][y-1] : Number.MAX_VALUE
            let vertical = x - 1 >= 0 ? matrix[x-1][y] : Number.MAX_VALUE
            let horizontal = y - 1 >= 0 ? matrix[x][y-1] : Number.MAX_VALUE
            if (diagonal <= Math.min(horizontal, vertical)) {
                x--
                y--
                if (diagonal === current || diagonal + 1 === current) {
                    if (diagonal + 1 === current) {
                        result.push({ action: "replace", key: y, newValue: newCollection[x] })
                    } 
                }
            } else if (horizontal <= vertical && horizontal === current || horizontal + 1 === current) {
                y--
                result.push({ action: "remove", key: y })
            } else {
                x--;
                result.push({ action: "add",
                               newProperty: { afterKey: y-1,
                                              key: x,
                                              value: newCollection[x] }
                           })
            }
        }
        
        result.reverse()
        for (let i = 0; i < result.length; i++) {
            let change = result[i]
            if (change.action === "add") {
                for (let j = i + 1; j < result.length; j++) {
                    let laterChange = result[j]
                    if (laterChange.action === "replace" || laterChange.action === "remove") {
                        if (laterChange.key >= change.newProperty.afterKey) {
                            laterChange.key++
                        }
                    } else /* is add */ {
                        if (laterChange.newProperty.key >= change.newProperty.afterKey) {
                            laterChange.newProperty.afterKey++
                        }
                    }
                }
            } else if (change.action === "remove") {
                for (let j = i + 1; j < result.length; j++) {
                    let laterChange = result[j]
                    if (laterChange.action === "replace" || laterChange.action === "remove") {
                        if (laterChange.key >= change.key) {
                            laterChange.key--
                        }
                    } else /* is add */ {
                        if (laterChange.newProperty.key >= change.key) {
                            laterChange.newProperty.afterKey--
                        }
                    }
                }
            }
        }
    } else {
        // Use a simple diff for objects
        for (let key in oldCollection) {
            if (oldCollection.hasOwnProperty(key) && !newCollection.hasOwnProperty(key)) {
                result.push({ action: "remove", key: key })
            } else if (oldCollection.hasOwnProperty(key) && newCollection.hasOwnProperty(key) &&
                       !_api.util.objectEquals(oldCollection[key], newCollection[key])) {
                result.push({ action: "replace", key: key, newValue: newCollection[key] })
            }
        }
        let last
        for (let key in newCollection) {
            if (newCollection.hasOwnProperty(key) && !oldCollection.hasOwnProperty(key)) {
                result.push( {action: "add", newProperty: { afterKey: last, key: key, value: newCollection[key] } } )
                last = key
            }
        }
    }
     
    return result
 }