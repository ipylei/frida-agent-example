import sark
import re
import ida_auto
def nop(ea):
    import idc
    #1f 20 03 d5 arm64 nop
    idc.patch_byte(ea,0x1f)
    idc.patch_byte(ea+1, 0x20)
    idc.patch_byte(ea+2, 0x03)
    idc.patch_byte(ea+3, 0xd5)
    return
if __name__ == '__main__':
    logfilepath="D:\\PycharmProjects\\20220123\\stalkertrace.log"
    logfile=open(logfilepath,'r')
    array=[]
    for line in logfile.readlines():
        if(line.find("run:")>=0):
            #offset:0x25914---
            addrarray=re.findall('offset:.*?---',line)
            for i in addrarray:
                addr=i[i.index(':')+1:len(i)-3]
                try:
                    addr_int=int(addr,0x10)
                    print(addr)
                    # print(addr_int)
                    array.append(addr_int)
                except Exception as e:
                    pass
            #         print(e)
            # print(line)
    for j in array:
        line=sark.line.Line(j)
        line.color=0x00ffff
        #print(line)

    lines = sark.lines(0x25914, 0x26f30)  # 相比0x25904前进了0x10个字节，因为前4条指令是使用Intercept.attach进行hook后再Frida Stalker，所以会有inline hook特征
    for line in lines:
        if line.type=="code":
            color=line.color
            if color is not None and color == 0x00ffff:
                pass
            else:
                nop(line.ea)
                
    #noprange(0x22390,0x24904)
    
    # 手动执行，合并块
    #ida_auto.plan_and_wait(0x25904,0x26f30)
