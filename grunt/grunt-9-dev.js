/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global module: true */
module.exports = function (grunt) {
    /*  development tasks configuration  */
    grunt.config.merge({
        watch: {
            "src-core": {
                files: [ "src/**/*.js", "src/**/*.pegjs" ],
                tasks: [ "stage1", "stage2", "stage3", "test" ]
            },
            "test-core": {
                files: [ "test/**/*.js" ],
                tasks: [ "test" ]
            },
            options: {
                nospawn: true
            }
        }
    })

    /*  register tasks  */
    grunt.registerTask("dev", [
        "stage1",
        "stage2",
        "stage3",
        "test",
        "watch"
    ])
}

