function is_emoji(str)
  -- Very rough check: emoji are generally outside ASCII and Latin1
  return string.find(str, "[\xF0-\xF4]") ~= nil
end

function Strong(el)
  -- If the strong (bold) block contains only emoji, return unbolded
  if #el.content == 1 and el.content[1].t == "Str" and is_emoji(el.content[1].text) then
    return el.content
  end
  return el
end
