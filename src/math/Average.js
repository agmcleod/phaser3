export function average () {

    let sum = 0;
    let len = arguments.length;

    for (let i = 0; i < len; i++)
    {
        sum += (+arguments[i]);
    }

    return sum / len;

}
