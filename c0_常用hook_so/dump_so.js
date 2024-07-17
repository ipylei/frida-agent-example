function dump(){
    //let file = new File("/data/data/com.example.ndktools/1.so", "wr");
    let file = new File("/data/data/com.example.ndktools/1.so", "a+");
    //file.write(ptr(0xd12d5000).readByteArray(0x18000));
    file.write(ptr(0xd12ee000).readByteArray(0x3000));
    file.flush();
    file.close();

}