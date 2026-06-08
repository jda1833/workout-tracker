from pydantic import BaseModel


class ProgramBase(BaseModel):
    week: int
    json_data: dict


class ProgramCreate(ProgramBase):
    pass


class Program(ProgramBase):
    id: int
    deleted: bool = False

    class Config:
        orm_mode = True


class CheckInBase(BaseModel):
    week: int
    json_data: dict


class CheckInCreate(CheckInBase):
    pass


class CheckIn(CheckInBase):
    id: int

    class Config:
        orm_mode = True
