export const getIdString = (idValue) => {
    if (!idValue) {
        return null;
    }

    if (idValue._id) {
        return idValue._id.toString();
    }

    return idValue.toString();
};