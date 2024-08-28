1.从ida中扣取出代码，使其成功执行
2.然后编译成动态库，这样python就能直接调用动态库了
    CmakeList.txt
        cmake_minimum_required(VERSION 3.26)
        project(uuid_checksum C)

        set(CMAKE_C_STANDARD 11)
        add_library(check SHARED example.c)

        add_executable(uuid_checksum main.c)
        target_link_libraries(uuid_checksum check)
