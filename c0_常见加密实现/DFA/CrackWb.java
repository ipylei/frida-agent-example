package zapata.wb.honeybee;

import com.github.unidbg.AndroidEmulator;
import com.github.unidbg.Emulator;
import com.github.unidbg.Module;
import com.github.unidbg.debugger.BreakPointCallback;
import com.github.unidbg.debugger.Debugger;
import com.github.unidbg.debugger.DebuggerType;
import com.github.unidbg.hook.hookzz.*;
import com.github.unidbg.linux.android.AndroidEmulatorBuilder;
import com.github.unidbg.linux.android.AndroidResolver;
import com.github.unidbg.linux.android.dvm.AbstractJni;
import com.github.unidbg.linux.android.dvm.DalvikModule;
import com.github.unidbg.linux.android.dvm.VM;
import com.github.unidbg.linux.android.dvm.array.ByteArray;
import com.github.unidbg.memory.Memory;
import com.sun.jna.Pointer;
import org.apache.commons.codec.binary.Hex;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class CrackWb extends AbstractJni {

    private final AndroidEmulator emulator;
    private final VM vm;
    private final Module module;



    public CrackWb(){
        emulator = AndroidEmulatorBuilder.for32Bit().setProcessName("").build();
        Memory memory = emulator.getMemory();
        memory.setLibraryResolver(new AndroidResolver(23));
        vm = emulator.createDalvikVM();
        vm.setJni(this);
        vm.setVerbose(false);
        DalvikModule dm = vm.loadLibrary(new File("unidbg-android/src/test/java/zapata/wb/honeybee/libhoneybee.so"), true);
        module = dm.getModule();
        vm.callJNI_OnLoad(emulator,module);
    }

    public void call_wb() {
        List<Object> list = new ArrayList<>(10);
        list.add(vm.getJNIEnv());
        list.add(0);
        list.add(vm.addLocalObject(new ByteArray(vm, "everhu".getBytes())));
        Number ret = module.callFunction(emulator, 0x92cd, list.toArray());
        byte[] bytes = (byte[]) vm.getObject(ret.intValue()).getValue();
        System.out.println(Hex.encodeHexString(bytes));
    }

    // public void myDebugger(){
    //     Debugger debugger = emulator.attach(DebuggerType.CONSOLE);
    //     // encryptBlock
    //     debugger.addBreakPoint(module.base + 0x9c94);
    //     // encdec
    //     debugger.addBreakPoint(module.base + 0x9e58);
    // }

    public int randInt(int min, int max){
        Random rand = new Random();
        return rand.nextInt(max - min) + min;
    }

    public void patch(){
        emulator.getMemory().pointer(module.base+0x9342).setInt(0,0x00f020e3);
        emulator.getMemory().pointer(module.base+0x9354).setInt(0,0x00f020e3);

    }

    public void dfa() {
        IHookZz hookZz = HookZz.getInstance(emulator);
        hookZz.wrap(module.base + 0x9e59, new WrapCallback<HookZzArm32RegisterContext>() {
            @Override
            public void preCall(Emulator<?> emulator, HookZzArm32RegisterContext ctx, HookEntryInfo info) {
                final Pointer output = ctx.getR0Pointer();
                ctx.push(output);
                
                //8次循环的地方
                emulator.attach().addBreakPoint(module.base + 0xA2AC, new BreakPointCallback() {
                    int count = 0;
                    @Override
                    public boolean onHit(Emulator<?> emulator, long address) {
                        count += 1;
                        // System.out.println(count);
                        if (count == 9) {
                            //在第9轮处设置故障：随机字节上注入(0~15)，注入随机内容(0~255)
                            output.setByte(randInt(0, 15), (byte) randInt(0, 255));
                            //output.setByte(0, (byte) 0);
                        }
                        return true;
                    }
                });
            }

            @Override
            public void postCall(Emulator<?> emulator, HookZzArm32RegisterContext ctx, HookEntryInfo info) {
                Pointer output = ctx.pop();
                byte[] outputHex = output.getByteArray(0, 16);
                System.out.println(Hex.encodeHexString(outputHex));
            }
        });
    }

    public static void main(String[] args) {
        CrackWb crackWb = new CrackWb();
        crackWb.patch();
        // crackWb.myDebugger();
        // crackWb.dfa();
        // for(int i=0; i<32; i++){
        crackWb.call_wb();
        // }

    }
}

// 3ddf3ef1c257e990555ee834a1c6f3f2
// 3d343ef12f57e990555ee806a1c6b4f2





