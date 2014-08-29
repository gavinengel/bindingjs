/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.connector.trim = class Trim {
    process (input) {
        if (_api.util.isReference(input)) {
            input = input.getValue()
        }
        return (input + "").trim()
    }
}

_api.repository.connector.register("trim", new _api.connector.trim())
