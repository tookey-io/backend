export const rolePathToArray = (path: string): string[] => {
    // parse dot separated path into array as tree
    const pathArray = path.split('.');
    // flatten tree into array of paths
    return pathArray.reduce((acc, curr, i) => {
        const path = pathArray.slice(0, i + 1).join('.');
        acc.push(path);
        return acc;
    }, [] as string[]);
}