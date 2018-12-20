for i in *.aiff; do ffmpeg -i "$i" "${i%.*}.mp3"; done
