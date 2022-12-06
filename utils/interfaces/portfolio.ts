export interface ISkill {
  id: string;
  image: string;
  description: string;
  title: string;
  wiki: string;
}

export interface IPortfolio {
  description: string;
  id: number;
  image: string;
  made_with: string[];
  title: string;
  type: string;
  url_github: string;
  url_web: string;
}

export interface IService {
  id: number;
  image: string;
  description: string;
  title: string;
}

export interface RootObject {
  backend: ISkill[];
  frontend: ISkill[];
  portfolio: IPortfolio[];
  services: IService[];
}
