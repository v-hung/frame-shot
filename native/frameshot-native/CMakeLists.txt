cmake_minimum_required(VERSION 3.15)
project(frameshot-native)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add executable
add_executable(frameshot-native src/main.cpp)

# Platform-specific settings
if(WIN32)
    # Windows specific libraries
    target_link_libraries(frameshot-native gdi32 user32)
elseif(APPLE)
    # macOS specific libraries
    find_library(CORE_GRAPHICS CoreGraphics)
    find_library(CORE_FOUNDATION CoreFoundation)
    target_link_libraries(frameshot-native ${CORE_GRAPHICS} ${CORE_FOUNDATION})
elseif(UNIX)
    # Linux specific libraries
    find_package(X11 REQUIRED)
    target_link_libraries(frameshot-native ${X11_LIBRARIES})
endif()

# Install to resources/bin
install(TARGETS frameshot-native DESTINATION ${CMAKE_SOURCE_DIR}/../../resources/bin)
