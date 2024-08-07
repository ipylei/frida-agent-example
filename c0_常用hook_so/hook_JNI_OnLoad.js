/*
    再dlopen onLeave里面完成 (onLeave)                 -> hook_dlopen_dlsym.js
    在init、init_array  onEnter|onLeave里面完成中完成    -> hook_init_array.js

    在dlsym  onEnter|onLeave里面完成 (onEnter)          -> hook_dlopen_dlsym.js
*/


function hook_dlopen(soName = '') {
    Interceptor.attach(Module.findExportByName(null, "android_dlopen_ext"),
        {
            onEnter: function (args) {
                var pathptr = args[0];
                if (pathptr !== undefined && pathptr != null) {
                    var path = ptr(pathptr).readCString();
                    if (path.indexOf(soName) >= 0) {
                        this.is_can_hook = true;
                    }
                }
            },
            onLeave: function (retval) {
                if (this.is_can_hook) {
                    hook_JNI_OnLoad()
                }
            }
        }
    );
}

function hook_JNI_OnLoad(){
    let module = Process.findModuleByName("libmsaoaidsec.so")
    Interceptor.attach(module.base.add(0xC6DC + 1), {
        onEnter(args){
            console.log("call JNI_OnLoad")
        }
    })
}

setImmediate(hook_dlopen, "libmsaoaidsec.so")
