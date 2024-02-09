const asyncHandler = (requesstHandler) => {
  (req, res, next) => {
    Promise.resolve(requesstHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
