/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*
** Returns a new View Data Binding instanceof
*/
$api.create = () => {
    return new _api.ViewDataBinding()
}

/*
** Allows to set or retrieve a reference to jQuery
** - Without a parameter, the current reference to jQuery is returned
** - With a parameter, the current reference is overwritten
*/
$api.$ = () => {
    if (arguments.length > 1) {
        throw _api.util.exception("Expected no or one argument but received " + arguments.length)
    }
    
    if (arguments.length === 0) {
        // Return jQuery
        if (_api.$) {
            return _api.$
        } else {
            // Try default access
            /* global jQuery */
            if (typeof jQuery !== "undefined") {
                return jQuery
            } else {
               throw _api.util.exception("BindingJS requires jQuery which is not loaded or not " +
                                         "registered under its default name 'jQuery'. If you use " +
                                         "another or no symbol for jQuery, please provide a " +
                                         "reference to jQuery first by calling BindingJS.$(jQuery)")
            }
        }
    } else /* if (arguments.length == 1) */ {
        // Set jQuery
        _api.$ = arguments[0]
        return $api
    }
}

/*
** Allows logging debug messages or setting the debug level
** - debug()            Returns current debug level
** - debug(level)       Sets new debug level
** - debug(level, msg)  Logs message at given debug level
*/
$api.debug = (() => {
    let debug_level = 9
    return (level, msg) => {
        if (arguments.length === 0) {
            /*  return old debug level  */
            return debug_level
        } else if (arguments.length === 1) {
            /*  configure new debug level  */
            debug_level = level
            return $api
        } else {
            /*  perform runtime logging  */
            if (level <= debug_level) {
                /*  determine indentation based on debug level  */
                let indent = ""
                for (let i = 1; i < level; i++)
                    indent += "    "

                /*  display debug message  */
                _api.util.log("DEBUG[" + level + "]: " + indent + msg)
            }
            return $api
        }
    }
})()

// TODO: Add docu
$api.plugin = (name, component) => {
    // TODO: Check type of component and if correct methods present
    if (typeof component.type === "function") {
        // Adapter
        _api.repository.adapter.register(name, component)
    } else {
        // Connector
        _api.repository.connector.register(name, component)
    }
}

// TODO: Add docu
$api.abortSymbol = {}