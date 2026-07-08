#!/usr/bin/env lua
-- Portfolio Optimizer — runs in GitHub Actions before deploy
local lfs = require("lfs")  -- LuaFileSystem

local function read_file(path)
    local f = io.open(path, "r")
    if not f then return nil end
    local content = f:read("*a")
    f:close()
    return content
end

local function write_file(path, content)
    local f = io.open(path, "w")
    f:write(content)
    f:close()
end

-- Minify HTML: remove extra whitespace/comments
local function minify_html(content)
    content = content:gsub("<!--.--->", "")           -- remove comments
    content = content:gsub("%s+", " ")                  -- collapse whitespace
    content = content:gsub("> <", "><")                -- remove space between tags
    return content
end

-- Minify CSS: remove whitespace and comments
local function minify_css(content)
    content = content:gsub("/%*.-%*/", "")              -- remove /* comments */
    content = content:gsub("%s*{%s*", "{")             -- clean braces
    content = content:gsub("%s*}%s*", "}")
    content = content:gsub("%s*:%s*", ":")
    content = content:gsub("%s*;%s*", ";")
    content = content:gsub("%s*,%s*", ",")
    content = content:gsub("%s+", " ")
    return content
end

-- Minify JS: basic whitespace collapse
local function minify_js(content)
    content = content:gsub("//.-\n", "\n")             -- remove // comments
    content = content:gsub("/%*.-%*/", "")            -- remove /* comments */
    content = content:gsub("%s+", " ")
    return content
end

-- Process directory recursively
local function optimize_dir(dir)
    for file in lfs.dir(dir) do
        if file ~= "." and file ~= ".." and file ~= ".git" then
            local path = dir .. "/" .. file
            local attr = lfs.attributes(path)
            
            if attr.mode == "directory" then
                optimize_dir(path)
            elseif attr.mode == "file" then
                local ext = file:match("%.([^%.]+)$")
                local content = read_file(path)
                if not content then goto continue end
                
                local original_size = #content
                local optimized = content
                
                if ext == "html" then
                    optimized = minify_html(content)
                elseif ext == "css" then
                    optimized = minify_css(content)
                elseif ext == "js" then
                    optimized = minify_js(content)
                end
                
                if optimized ~= content then
                    write_file(path, optimized)
                    local new_size = #optimized
                    local saved = original_size - new_size
                    print(string.format("✓ %s (%d bytes → %d bytes, saved %d)", 
                        path, original_size, new_size, saved))
                end
                
                ::continue::
            end
        end
    end
end

-- Generate cache-busting manifest
local function generate_manifest()
    local manifest = {}
    for file in lfs.dir(".") do
        if file:match("%.html$") or file:match("%.css$") or file:match("%.js$") then
            local f = io.open(file, "rb")
            if f then
                local content = f:read("*a")
                f:close()
                local hash = tostring(#content):sub(1,8)
                manifest[file] = hash
            end
        end
    end
    
    local out = io.open("build-manifest.json", "w")
    out:write(require("cjson").encode(manifest))
    out:close()
    print("✓ Generated build-manifest.json")
end

-- Main
print("🔧 Optimizing portfolio for production...")
optimize_dir(".")
generate_manifest()
print("✅ Optimization complete!")
