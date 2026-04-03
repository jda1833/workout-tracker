from pydantic import BaseModel

class ProgramBase(BaseModel):
    week: int
    json_data: dict

class ProgramCreate(ProgramBase):
    pass

class Program(ProgramBase):
    id: int
    class Config:
        orm_mode = True