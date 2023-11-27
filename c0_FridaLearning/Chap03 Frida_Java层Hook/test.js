function printSeparator(mode = "start", num = 50) {
    if (mode === "start") {
        console.log(">>>" + "-".repeat(num));
    } else if (mode === "end") {
        console.log("<<<" + "-".repeat(num) + '\n');
    }
}


printSeparator()
console.log("hello world");
printSeparator("end")
console.log("hello python")

//Memory.readByteArray
//ArrayBuffer
