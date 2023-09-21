if [[ ! ${1} ]]; then
    echo "No fileId"
    exit 1
fi

localhost="127.0.0.1"
data=$(curl -sLf "http://${localhost}/data?fileId=${1}" | jq -r ".")
error=$(echo $data | jq -r ".error")

if [[ $error == true ]]; then
    msg=$(echo $data | jq -r ".msg")
    echo "${msg}"
    exit 1
fi

type=$(echo $data | jq -r ".type")
source=$(echo $data | jq -r ".source")
slug=$(echo $data | jq -r ".slug")
quality=$(echo $data | jq -r ".quality")
outPutPath=$(echo $data | jq ".outPutPath"  --raw-output)
root_dir=$(echo $data | jq -r ".root_dir")

#sudo bash ${root_dir}/shell/updatePercent.sh ${slug} > /dev/null &

if [[ $source != "null" ]]; then

    outPut=${outPutPath}/file_default.mp4
    downloadtmpSave="${outPutPath}/file_default.txt"
    
    curl "${source}" -o ${outPut} --progress-bar > ${downloadtmpSave} 2>&1

    echo "${slug} | Downloaded"
fi

sleep 5
sudo bash ${root_dir}/shell/convert.sh ${slug} 

sleep 5
sudo bash ${root_dir}/shell/thumbnail.sh ${slug} 
sleep 5
curl -sS "http://${localhost}/done/${slug}"

exit 1