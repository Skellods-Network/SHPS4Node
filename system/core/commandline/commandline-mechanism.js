'use strict';

var colors = require('colors');

var index = require('./index-commandline.js');

var me = module.exports;


GLOBAL.SHPS_COML_TASK_RESULT_OK = 'OK'.green.bold;
GLOBAL.SHPS_COML_TASK_RESULT_WARNING = 'WARNING'.yellow.bold;
GLOBAL.SHPS_COML_TASK_RESULT_ERROR = 'ERROR'.red.bold;


me.newTask = function ($name) {
    
    index.write(('\n' + $name + '...').bold);
    var start = process.hrtime()[1];
    return {
        
        end: function f_commandline_newTask_end($result) {
            
            var time = (process.hrtime()[1] - start) / 1000000 |0;
            var rxRemoveEscapes = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
            var rl = time.toString().length + $name.replace(rxRemoveEscapes, '').length + $result.replace(rxRemoveEscapes, '').length + 9;
            var l = process.stdout.columns - rl;
            var i = 0;
            var space = '';
            while (i < l) {
                
                space += ' ';
                i++;
            }

            index.write($name + ': ' + time + 'ms' + space + '[ ' + $result + ' ]');
        },

        interim: function f_commandline_newTask_interim($result, $message) {
            
            var star = '*';
            switch ($result) {

                case SHPS_COML_TASK_RESULT_OK: {

                    star = star.green.bold;
                    break;
                }

                case SHPS_COML_TASK_RESULT_WARNING: {
                    
                    star = star.yellow.bold;
                    break;
                }

                case SHPS_COML_TASK_RESULT_ERROR: {
                    
                    star = star.red.bold;
                    break;
                }
            }

            index.write(' ' + star + ' ' + $message);
        },
    };
};
